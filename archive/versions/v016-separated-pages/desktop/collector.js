const $=id=>document.getElementById(id);const params=new URLSearchParams(location.search);for(const key of ['site','cert','grade'])if(params.has(key))$(key).value=params.get(key);
function show(state){$('phase').textContent=state.phase||state.state;$('message').textContent=state.message||'';}
async function start(){try{show(await window.collector.start({site:$('site').value,cert:$('cert').value,grade:$('grade').value}));}catch(e){show({phase:'未开始',message:e.message});}}
$('form').onsubmit=e=>{e.preventDefault();start();};$('retry').onclick=()=>window.collector.retry();window.collector.onState(show);if(params.get('cert'))start();
