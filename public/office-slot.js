/** Free visual toy: no wagers, balances, purchases, prizes or external requests. */
export const slotSymbols=['🍒','🍋','🔔','⭐','🍇'];
/** Return three uniform symbols; injected randomness supports deterministic checks. */
export function spinSymbols(random=Math.random){return Array.from({length:3},()=>{const value=random();if(!Number.isFinite(value)||value<0||value>=1)throw new RangeError('Random value must be in [0,1)');return slotSymbols[Math.floor(value*slotSymbols.length)];});}
export function slotMessage(symbols){return symbols.every(s=>s===symbols[0])?'세 개 일치! 🎉':'한 번 더 돌려볼까요?';}
