import type { SVGProps } from 'react';
export function CoinbaseWalletBlack(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 512 512"
      focusable={false}
      aria-hidden={true}
      {...props}
    >
      <g clipPath="url(#coinbase-wallet_black_svg__a)">
        <path fill="#000" d="M0 0h512v512H0z" />
        <path
          fill="#3773f5"
          fillRule="evenodd"
          d="M85 256c0 94.43 76.57 171 171 171s171-76.57 171-171S350.43 85 256 85 85 161.57 85 256m127.3-55.1c-6.317 0-11.4 5.083-11.4 11.4v87.4c0 6.317 5.083 11.4 11.4 11.4h87.4c6.317 0 11.4-5.083 11.4-11.4v-87.4c0-6.317-5.083-11.4-11.4-11.4z"
          clipRule="evenodd"
        />
      </g>
      <defs>
        <clipPath id="coinbase-wallet_black_svg__a">
          <path fill="#fff" d="M0 0h512v512H0z" />
        </clipPath>
      </defs>
    </svg>
  );
}
