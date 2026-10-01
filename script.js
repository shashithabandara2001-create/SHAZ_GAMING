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


// Compact real-video cards from SHAZ live streams. The API detects live/VOD streams from the channel.
(async function loadLiveMoments(){
  const grid=document.getElementById('liveMoments');
  if(!grid) return;
  const esc=(v='')=>v.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  try{
    const response=await fetch('/api/youtube?live=1',{headers:{Accept:'application/json'},cache:'no-store'});
    if(!response.ok) throw new Error(`API ${response.status}`);
    const data=await response.json();
    const items=(data.liveItems?.length?data.liveItems:data.items||[]).slice(0,6);
    if(!items.length) throw new Error('No public stream videos found');
    grid.innerHTML=items.map((video,i)=>{
      const title=esc(video.title||'SHAZ LIVE');
      const id=esc(video.videoId);
      const date=video.published?new Date(video.published).toLocaleDateString(undefined,{year:'numeric',month:'short',day:'numeric'}):'';
      return `<article class="moment-card">
        <div class="moment-video"><iframe loading="lazy" src="https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1" title="${title}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe><span class="moment-badge">${video.isLiveLike?'LIVE STREAM':'STREAM'}</span></div>
        <div class="moment-info"><span>PUBG MOBILE</span><h3>${title}</h3><p>${date}</p><a href="https://www.youtube.com/watch?v=${id}" target="_blank" rel="noopener">WATCH ON YOUTUBE ↗</a></div>
      </article>`;
    }).join('');
  }catch(error){
    console.error('Live moments error:',error);
    grid.innerHTML=`<div class="moment-error">Couldn’t load the real SHAZ streams right now. <a href="https://www.youtube.com/@SHAZ_playz" target="_blank" rel="noopener">Open SHAZ Playz ↗</a></div>`;
  }
})();

// Background music: prepared for assets/background-music.mp3 at a low 22% volume.
(function setupMusic(){
  const audio=document.getElementById('bgMusic'), btn=document.getElementById('musicToggle');
  if(!audio||!btn) return;
  audio.volume=0.22;
  let enabled=localStorage.getItem('shazMusicEnabled')==='1';
  const sync=()=>{btn.classList.toggle('on',enabled);btn.setAttribute('aria-pressed',String(enabled));btn.querySelector('b').textContent=enabled?'ON':'MUSIC';};
  const start=()=>{if(enabled) audio.play().catch(()=>{});};
  btn.addEventListener('click',()=>{enabled=!enabled;localStorage.setItem('shazMusicEnabled',enabled?'1':'0');if(enabled) audio.play().catch(()=>{});else audio.pause();sync();});
  window.addEventListener('pointerdown',start,{once:true});
  sync();
})();

// Community comments: Supabase-backed, shared across all visitors.
(function setupComments(){
  const form=document.getElementById('commentForm');
  const list=document.getElementById('commentsList');
  const count=document.getElementById('commentCount');
  const status=document.getElementById('commentStatus');
  const refresh=document.getElementById('commentRefresh');
  const submit=document.getElementById('commentSubmit');
  if(!form||!list) return;

  const cfg=window.SHAZ_SUPABASE_CONFIG||{};
  const configured=cfg.url && cfg.anonKey && !cfg.url.includes('YOUR-PROJECT') && !cfg.anonKey.includes('YOUR_SUPABASE');
  let client=null;
  if(window.supabase && configured) client=window.supabase.createClient(cfg.url,cfg.anonKey);

  const esc=(v='')=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const relative=(iso)=>{
    const sec=Math.max(0,Math.floor((Date.now()-new Date(iso).getTime())/1000));
    if(sec<60) return 'just now';
    const units=[[86400,'day'],[3600,'hour'],[60,'minute']];
    for(const [n,label] of units) if(sec>=n){const x=Math.floor(sec/n);return `${x} ${label}${x===1?'':'s'} ago`;}
    return 'just now';
  };
  const setStatus=(msg,error=false)=>{status.textContent=msg;status.classList.toggle('error',error)};

  const render=(rows)=>{
    count.textContent=String(rows.length);
    if(!rows.length){list.innerHTML='<div class="comments-empty">No comments yet. Be the first to say something 👋</div>';return;}
    list.innerHTML=rows.map(row=>`<article class="comment-item"><div class="comment-avatar">${esc((row.name||'?').trim().charAt(0).toUpperCase())}</div><div class="comment-body"><div class="comment-meta"><strong>${esc(row.name)}</strong><time datetime="${esc(row.created_at)}">${relative(row.created_at)}</time></div><p>${esc(row.comment).replace(/\n/g,'<br>')}</p></div></article>`).join('');
  };

  async function load(){
    if(!client){
      list.innerHTML='<div class="comments-setup">Comments are ready, but the Supabase connection is not configured yet.</div>';
      count.textContent='0';
      setStatus('Add your Supabase URL and anon public key in supabase-config.js.',true);
      return;
    }
    list.innerHTML='<div class="comments-loading">LOADING COMMENTS…</div>';
    const {data,error}=await client.from('comments').select('id,name,comment,created_at').order('created_at',{ascending:false}).limit(100);
    if(error){console.error(error);list.innerHTML='<div class="comments-error">Couldn’t load comments right now. Please try again.</div>';setStatus('Couldn’t connect to the comments database.',true);return;}
    render(data||[]);setStatus('Your comment will appear here for everyone.');
  }

  form.addEventListener('submit',async(e)=>{
    e.preventDefault();
    if(!client){setStatus('Comments are not connected yet. Please finish the Supabase setup.',true);return;}
    const name=form.name.value.trim(), comment=form.comment.value.trim();
    if(name.length<2){setStatus('Please enter your name.',true);form.name.focus();return;}
    if(comment.length<2){setStatus('Please write a comment.',true);form.comment.focus();return;}
    if(name.length>60||comment.length>1000){setStatus('Please keep the name under 60 characters and comment under 1000.',true);return;}
    submit.disabled=true;submit.classList.add('loading');setStatus('POSTING COMMENT…');
    const {error}=await client.from('comments').insert({name,comment});
    submit.disabled=false;submit.classList.remove('loading');
    if(error){console.error(error);setStatus('Couldn’t post your comment. Please try again.',true);return;}
    form.reset();setStatus('Comment posted successfully!');await load();
  });
  refresh?.addEventListener('click',load);
  load();
})();
