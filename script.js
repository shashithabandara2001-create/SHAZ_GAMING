const menuBtn=document.getElementById('menuBtn');const nav=document.getElementById('navLinks');
menuBtn?.addEventListener('click',()=>{nav.classList.toggle('open');document.body.classList.toggle('menu-open')});
nav?.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{nav.classList.remove('open');document.body.classList.remove('menu-open')}));


// Automatically load the latest public uploads from the SHAZ Playz YouTube channel.
(async function loadLatestYouTubeVideos(){
  const grid=document.getElementById('youtubeVideos');
  if(!grid) return;
  const channelUrl='https://www.youtube.com/@SHAZ_playz';
  const escapeHtml=(value='')=>value.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const timeAgo=(date)=>{
    const seconds=Math.max(1,Math.floor((Date.now()-new Date(date).getTime())/1000));
    const units=[[31536000,'year'],[2592000,'month'],[604800,'week'],[86400,'day'],[3600,'hour'],[60,'minute']];
    for(const [size,name] of units){if(seconds>=size){const n=Math.floor(seconds/size);return `${n} ${name}${n===1?'':'s'} ago`;}}
    return 'just now';
  };
  try{
    const response=await fetch('/api/youtube',{headers:{Accept:'application/json'},cache:'no-store'});
    if(!response.ok) throw new Error(`API ${response.status}`);
    const data=await response.json();
    if(!data.items?.length) throw new Error('No public videos found');
    grid.innerHTML=data.items.slice(0,3).map((video,index)=>{
      const title=escapeHtml(video.title);
      const thumb=escapeHtml(video.thumbnail);
      const url=escapeHtml(video.url);
      const date=video.published ? timeAgo(video.published) : 'YouTube upload';
      return `<a class="video-card ${index===0?'big':''}" href="${url}" target="_blank" rel="noopener noreferrer">
        <div class="thumb"><img class="video-thumb" src="${thumb}" alt="${title}" loading="${index===0?'eager':'lazy'}"><div class="thumb-overlay"></div><span class="play">▶</span>${index===0?'<label>LATEST</label>':''}</div>
        <div class="video-info"><span>PUBG MOBILE</span><h3>${title}</h3><p>${date} · Watch on YouTube</p></div>
      </a>`;
    }).join('');
  }catch(error){
    console.error('YouTube feed error:',error);
    grid.innerHTML=`<div class="video-error">Couldn’t load the latest videos right now. <a href="${channelUrl}" target="_blank" rel="noopener">Open SHAZ Playz on YouTube ↗</a></div>`;
  }
})();


// Latest Lives: keep Facebook and YouTube live pages visible, and add the
// newest SHAZ YouTube uploads as stream cards when the feed is available.
(async function loadLatestLives(){
  const grid=document.getElementById('latestLives');
  if(!grid) return;
  const escapeHtml=(value='')=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const formatDate=(date)=>{
    if(!date) return 'Recent stream';
    return new Date(date).toLocaleDateString(undefined,{year:'numeric',month:'short',day:'numeric'});
  };
  try{
    const response=await fetch('/api/youtube',{headers:{Accept:'application/json'},cache:'no-store'});
    if(!response.ok) throw new Error(`API ${response.status}`);
    const data=await response.json();
    const items=(data.items||[]).slice(0,4);
    const cards=items.map((video,index)=>{
      const title=escapeHtml(video.title);
      const thumb=escapeHtml(video.thumbnail);
      const url=escapeHtml(video.url);
      return `<a class="live-card" href="${url}" target="_blank" rel="noopener noreferrer">
        <div class="live-card-thumb"><img src="${thumb}" alt="${title}" loading="${index<2?'eager':'lazy'}"><span class="live-badge">YOUTUBE</span><span class="live-play">▶</span></div>
        <div class="live-card-info"><span>RECENT STREAM</span><h3>${title}</h3><p>${formatDate(video.published)} · Watch on YouTube</p><b>WATCH ↗</b></div>
      </a>`;
    });
    // Keep the two direct live-page cards first, then recent stream cards.
    const pinned=grid.querySelectorAll('.live-card:not(.live-loading)');
    const pinnedHtml=[...pinned].map(el=>el.outerHTML).join('');
    grid.innerHTML=pinnedHtml+cards.slice(0,3).join('');
  }catch(error){
    console.error('Latest Lives error:',error);
    const loading=grid.querySelector('.live-loading');
    if(loading) loading.outerHTML=`<a class="live-card live-youtube" href="https://www.youtube.com/@SHAZ_playz/live" target="_blank" rel="noopener"><div class="live-card-thumb"><img src="assets/shaz-brand-art.jpg" alt="SHAZ YouTube Live"><span class="live-badge">YOUTUBE LIVE</span><span class="live-play">▶</span></div><div class="live-card-info"><span>YOUTUBE</span><h3>Open SHAZ Live</h3><p>See the latest live streams on YouTube.</p><b>WATCH LIVE ↗</b></div></a>`;
  }
})();
