/// <reference types="vite/client" />

declare module '*.html?raw' {
  const content: string;
  export default content;
}

declare module '@designcodeio/threeui/style.css' {
  const content: any;
  export default content;
}

declare module 'vanta/dist/vanta.net.min' {
  const NET: any;
  export default NET;
}

