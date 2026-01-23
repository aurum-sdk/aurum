import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import enquirer from 'enquirer';
import semver from 'semver';
import pc from 'picocolors';
import dotenv from 'dotenv';

// Load .env from root
dotenv.config();

const { prompt } = enquirer;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

async function main() {
  console.log(pc.bold(pc.blue('\nAurum Release Wizard\n')));

  // 1. Run tests first
  console.log(pc.gray('Running tests...'));
  try {
    execSync('pnpm -r --filter=./packages/* test', { stdio: 'inherit' });
    console.log(pc.bold(pc.green('✅ All tests passed!\n')));
  } catch (error) {
    console.error(pc.red('\n❌ Tests failed! Fix failing tests before releasing.'));
    process.exit(1);
  }

  // 2. Read current version
  const rootPkgPath = path.join(ROOT_DIR, 'package.json');
  const rootPkg = JSON.parse(fs.readFileSync(rootPkgPath, 'utf-8'));
  const currentVersion = rootPkg.version;

  console.log(`${pc.gray('Current version:')} ${pc.bold(currentVersion)}`);

  // 3. Prompt for Release Type (Production vs Canary)
  const { releaseType } = await prompt({
    type: 'select',
    name: 'releaseType',
    message: 'Select release type:',
    choices: [
      { name: 'production', message: 'Production (e.g. 1.0.0)' },
      { name: 'canary', message: 'Canary (e.g. 1.0.0-canary.0)' },
    ],
  });

  // 4. Prompt for Bump Type
  const isCurrentCanary = currentVersion.includes('-canary');

  // Build choices based on release type and current version
  const bumpChoices = [
    { name: 'patch', message: 'Patch' },
    { name: 'minor', message: 'Minor' },
    { name: 'major', message: 'Major' },
  ];

  // Add prerelease option for canary releases when already on a canary version
  if (releaseType === 'canary' && isCurrentCanary) {
    const nextPrerelease = semver.inc(currentVersion, 'prerelease', 'canary');
    bumpChoices.unshift({
      name: 'prerelease',
      message: `Prerelease (${currentVersion} → ${nextPrerelease})`,
    });
  }

  const { bumpType } = await prompt({
    type: 'select',
    name: 'bumpType',
    message: 'Select version bump:',
    choices: bumpChoices,
  });

  // 5. Calculate New Version
  let newVersion;
  if (releaseType === 'canary') {
    if (bumpType === 'prerelease') {
      // Just increment the canary number (e.g., 0.2.2-canary.0 → 0.2.2-canary.1)
      newVersion = semver.inc(currentVersion, 'prerelease', 'canary');
    } else {
      // Bump the base version and start new canary (e.g., 0.2.2-canary.1 → 0.2.3-canary.0)
      newVersion = semver.inc(currentVersion, `pre${bumpType}`, 'canary');
    }
  } else {
    // Production release
    if (isCurrentCanary) {
      // When going from canary to production, bump from last production version (not canary base)
      let lastProductionVersion = currentVersion;
      try {
        const tags = execSync('git tag -l "v*" --sort=-v:refname', { encoding: 'utf-8' })
          .trim()
          .split('\n')
          .filter(Boolean);
        const productionTag = tags.find((tag) => !tag.includes('canary'));
        if (productionTag) {
          lastProductionVersion = productionTag.replace(/^v/, '');
          console.log(`${pc.gray('Last production version:')} ${pc.bold(lastProductionVersion)}`);
        }
      } catch {
        // If git fails, fall back to stripping prerelease from current version
        lastProductionVersion = currentVersion.replace(/-canary\.\d+$/, '');
      }
      newVersion = semver.inc(lastProductionVersion, bumpType);
    } else {
      newVersion = semver.inc(currentVersion, bumpType);
    }
  }

  // 6. Confirm Version
  const { confirmed } = await prompt({
    type: 'confirm',
    name: 'confirmed',
    message: `Bump version from ${pc.cyan(currentVersion)} to ${pc.green(newVersion)}?`,
    initial: true,
  });

  if (!confirmed) {
    console.log(pc.red('\nRelease cancelled.'));
    process.exit(0);
  }

  // 7. Prompt for changelog entry
  console.log(pc.gray('\nDescribe what changed in this release.'));
  console.log(pc.gray('Use bullet points for multiple changes. Press Enter twice when done.\n'));

  const { changelogEntry } = await prompt({
    type: 'input',
    name: 'changelogEntry',
    message: 'Changelog entry (or leave empty to skip):',
  });

  if (changelogEntry && changelogEntry.trim()) {
    const changelogPath = path.join(ROOT_DIR, 'CHANGELOG.md');
    const date = new Date().toISOString().split('T')[0];

    // Format the entry - if it doesn't start with a bullet, add one
    const formattedEntry = changelogEntry
      .split('\n')
      .map((line) => {
        const trimmed = line.trim();
        if (!trimmed) return '';
        if (trimmed.startsWith('-') || trimmed.startsWith('*')) return trimmed;
        return `- ${trimmed}`;
      })
      .filter(Boolean)
      .join('\n');

    const newSection = `## [${newVersion}] - ${date}\n\n${formattedEntry}\n`;

    let changelog;
    if (fs.existsSync(changelogPath)) {
      changelog = fs.readFileSync(changelogPath, 'utf-8');
      // Insert after the title line
      changelog = changelog.replace(/^(# Changelog\n+)/, `$1${newSection}\n`);
    } else {
      changelog = `# Changelog\n\nAll notable changes to Aurum SDK.\n\n${newSection}`;
    }

    fs.writeFileSync(changelogPath, changelog);
    console.log(`  ${pc.green('✓')} Updated CHANGELOG.md`);
  } else {
    console.log(pc.gray('  Skipping changelog update.'));
  }

  // 8. Get SENTRY_DSN from env
  const sentryDsn = process.env.SENTRY_DSN || '';
  if (sentryDsn) {
    console.log(`${pc.gray('Using SENTRY_DSN from .env')}`);
  } else {
    console.log(`${pc.yellow('⚠️ SENTRY_DSN not found in .env, skipping injection.')}`);
  }

  // 9. Update all package.json files
  const packagesDir = path.join(ROOT_DIR, 'packages');
  const packages = fs.readdirSync(packagesDir).filter((f) => {
    return (
      fs.statSync(path.join(packagesDir, f)).isDirectory() && fs.existsSync(path.join(packagesDir, f, 'package.json'))
    );
  });

  const allPkgPaths = [rootPkgPath, ...packages.map((p) => path.join(packagesDir, p, 'package.json'))];

  console.log(pc.gray('\nUpdating package.json files...'));
  for (const pkgPath of allPkgPaths) {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    pkg.version = newVersion;

    // Also update internal workspace dependencies if they exist
    if (pkg.dependencies) {
      for (const dep in pkg.dependencies) {
        if (pkg.dependencies[dep].startsWith('workspace:')) {
          // pnpm workspace dependencies usually use workspace:^ or workspace:*
          // If we want to keep them synced, we can leave them as is or update them.
          // Usually workspace:^ is fine as pnpm handles the resolution.
        }
      }
    }

    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
    console.log(`  ${pc.green('✓')} ${path.relative(ROOT_DIR, pkgPath)}`);
  }

  // 10. Run Build
  console.log(pc.gray('\nRunning build...'));
  try {
    // Inject SENTRY_DSN into the environment for the build process
    const env = { ...process.env, SENTRY_DSN: sentryDsn };
    execSync('pnpm build', { stdio: 'inherit', env });
    console.log(pc.bold(pc.green('\n✅ Build successful!')));
  } catch (error) {
    console.error(pc.red('\n❌ Build failed!'));
    process.exit(1);
  }

  console.log(pc.bold(pc.cyan('\n✨ Version bump complete.')));

  // 11. Prompt to publish
  const { shouldPublish } = await prompt({
    type: 'confirm',
    name: 'shouldPublish',
    message: 'Publish packages to npm now?',
    initial: true,
  });

  if (shouldPublish) {
    const npmTag = releaseType === 'canary' ? 'canary' : 'latest';

    // Publish in dependency order: types → logos → core → hooks
    const publishOrder = ['types', 'logos', 'core', 'hooks'];

    console.log(pc.gray(`\nPublishing packages with tag "${npmTag}"...`));

    for (const pkgName of publishOrder) {
      const pkgDir = path.join(packagesDir, pkgName);
      if (!fs.existsSync(pkgDir)) continue;

      const pkgJson = JSON.parse(fs.readFileSync(path.join(pkgDir, 'package.json'), 'utf-8'));
      console.log(pc.gray(`\nPublishing ${pkgJson.name}@${newVersion}...`));

      try {
        execSync(`pnpm publish --access public --tag ${npmTag} --no-git-checks`, {
          cwd: pkgDir,
          stdio: 'inherit',
        });
        console.log(`  ${pc.green('✓')} Published ${pkgJson.name}@${newVersion}`);
      } catch (error) {
        console.error(pc.red(`\n❌ Failed to publish ${pkgJson.name}`));
        process.exit(1);
      }
    }

    console.log(pc.bold(pc.green('\n🎉 All packages published successfully!')));

    // 12. Commit version changes and create git tag (only for production releases)
    if (releaseType === 'production') {
      const tagName = `v${newVersion}`;

      // Commit version changes
      console.log(pc.gray('\nCommitting version changes...'));
      try {
        execSync('git add .', { stdio: 'inherit' });
        execSync(`git commit -m "chore: release ${tagName}"`, { stdio: 'inherit' });
        console.log(`  ${pc.green('✓')} Committed version changes`);

        // Push the commit
        execSync('git push origin master', { stdio: 'inherit' });
        console.log(`  ${pc.green('✓')} Pushed to master`);
      } catch (error) {
        console.error(pc.yellow(`\n⚠️ Failed to commit/push. You can do it manually:`));
        console.log(pc.gray(`  git add . && git commit -m "chore: release ${tagName}" && git push`));
      }

      // Create and push tag
      console.log(pc.gray(`\nCreating git tag ${tagName}...`));
      try {
        execSync(`git tag ${tagName}`, { stdio: 'inherit' });
        console.log(`  ${pc.green('✓')} Created tag ${tagName}`);

        execSync(`git push origin ${tagName}`, { stdio: 'inherit' });
        console.log(`  ${pc.green('✓')} Pushed tag ${tagName} to origin`);
      } catch (error) {
        console.error(pc.yellow(`\n⚠️ Failed to create/push git tag. You can do it manually:`));
        console.log(pc.gray(`  git tag ${tagName} && git push origin ${tagName}`));
      }
    }
  } else {
    console.log(pc.yellow('\nSkipped publishing. Run manually with:'));
    console.log(pc.gray('  pnpm -r publish --access public --no-git-checks'));
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
