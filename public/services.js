export const defaultServices = {gpt:'https://chatgpt.com/',claude:'https://claude.ai/new',gemini:'https://gemini.google.com/app',muse:'https://muse.ai/',copilot:'https://copilot.microsoft.com/'};
export function serviceUrl(value){try{const url=new URL(value);return url.protocol==='https:'&&!url.username&&!url.password?url.href:null;}catch{return null;}}
