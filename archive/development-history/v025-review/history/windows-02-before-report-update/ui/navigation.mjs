// Page switching is independent of the capture engine and archive data.
export function createPageNavigation({library,capture,libraryNav,queryNav,title},{onCapture,onLeave,scrollTop}){
 return function page(query){
  if(!query)onLeave();
  library.hidden=query;capture.hidden=!query;
  libraryNav.classList.toggle('active',!query);queryNav.classList.toggle('active',query);
  for(const [nav,active] of [[libraryNav,!query],[queryNav,query]]){if(active)nav.setAttribute('aria-current','page');else nav.removeAttribute('aria-current');}
  title.innerHTML=query?'查询与采集<span>CAPTURE</span>':'库<span>LIBRARY</span>';
  if(query)onCapture();
  scrollTop();
 };
}
