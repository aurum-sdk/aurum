module.exports = {
  typescript: true,
  jsxRuntime: 'automatic',
  svgProps: {
    focusable: '{false}',
    'aria-hidden': '{true}',
  },
  svgoConfig: {
    plugins: [
      {
        name: 'preset-default',
        params: {
          overrides: {
            removeViewBox: false,
          },
        },
      },
      'removeDimensions',
      'prefixIds',
    ],
  },
  filenameCase: 'pascal',
  exportType: 'named',
  template: (variables, { tpl }) => {
    // Convert "Svgmetamaskicon" -> "MetamaskIcon"
    // Remove "Svg" prefix and properly capitalize
    let name = variables.componentName.replace(/^Svg/, '');
    // Capitalize first letter and letter after each non-letter char
    name = name.charAt(0).toUpperCase() + name.slice(1);
    // Find positions like "icon", "brand", "black", "white" and capitalize them
    name = name.replace(
      /(icon|brand|black|white)$/i,
      (match) => match.charAt(0).toUpperCase() + match.slice(1).toLowerCase(),
    );

    return tpl`
import type { SVGProps } from 'react';

export function ${name}(props: SVGProps<SVGSVGElement>) {
  return (${variables.jsx});
}
`;
  },
};
