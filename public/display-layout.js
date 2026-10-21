// Left-screen placement keeps frequent controls nearest the center monitor.
const select=document.querySelector('#display-layout');let layout='left';try{const saved=localStorage.getItem('jbco-display-layout');if(['left','standard'].includes(saved))layout=saved;}catch{}
function apply(){document.body.classList.toggle('left-monitor',layout==='left');if(select)select.value=layout;}
apply();if(select)select.onchange=()=>{layout=select.value;apply();try{localStorage.setItem('jbco-display-layout',layout);}catch{select.title='현재 화면에만 적용됩니다.';}};
