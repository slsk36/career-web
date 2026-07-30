import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
  },
  {
    /**
     * OG 이미지 렌더링 코드에 한해 `<img>` 를 허용한다.
     *
     * 이 디렉터리의 JSX 는 브라우저로 가지 않는다. next/og(satori) 가 서버에서 읽어
     * 1200×630 PNG 로 굽는 입력일 뿐이라, 규칙이 막으려는 LCP 저하와 대역폭 낭비가
     * 애초에 성립하지 않는다. next/image 는 satori 가 해석하지 못해 대안이 되지 못하고,
     * `background-image` + data URI 는 satori 가 조용히 무시한다(2026-07-30 실측).
     *
     * 예외는 이 디렉터리로만 한정한다. 화면에 렌더링되는 컴포넌트는 종전대로
     * next/image 를 쓰고 `<img>` 를 금지한다.
     */
    files: ["src/lib/og/**/*.tsx"],
    rules: {
      "@next/next/no-img-element": "off",
    },
  },
];

export default eslintConfig;
