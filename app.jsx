const { useState, useEffect, useRef } = React;

// PhoneMockup removed — phone will no longer be rendered as part of the scene

// Small visual nav — intentionally minimal and integrated
function TinyNav(){
  return (
    <div className="tiny-nav" aria-hidden>
      <div className="brand-large"> <span id="brand-codexa">CODEXA</span> </div>
    </div>
  )
}

function Home({onNavigate}){
  // sample recent projects
  const recent = [
    {id:1,title:'Loja E-commerce',tech:'Java, React',status:'Produção',color:'#4f46e5'},
    {id:2,title:'App Financeiro',tech:'Flutter, Spring',status:'Em andamento',color:'#00d4a6'}
  ];
  return (
    <div className="view home">
      <div className="home-top">
        <div>
          <h2>Olá — Bem-vindo à <strong>CODEXA</strong></h2>
          <p className="muted">Seu espaço para organizar, explorar e lançar projetos digitais.</p>
        </div>
        <div className="stats">
          <div className="stat"><div className="num">12</div><div className="label muted">Projetos</div></div>
          <div className="stat"><div className="num">8</div><div className="label muted">Em produção</div></div>
        </div>
      </div>

      <h4>Projetos recentes</h4>
      <div className="recent-grid">
        {recent.map(r=> (
          <div key={r.id} className="recent-card" onClick={()=>onNavigate('projects')}>
            <div className="rc-left" style={{background:r.color}}></div>
            <div className="rc-body">
              <div className="rc-title">{r.title}</div>
              <div className="muted rc-sub">{r.tech} • {r.status}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="home-actions" style={{marginTop:12}}>
        <button className="btn primary" onClick={()=>onNavigate('projects')}>Ver todos os projetos</button>
        <button className="btn ghost" onClick={()=>onNavigate('explore')}>Explorar</button>
      </div>
    </div>
  )
}

function ProjectCard({p,onOpen}){
  return (
    <div className="project-card" onClick={()=>onOpen(p)} onMouseDown={(e)=>e.currentTarget.classList.add('pressed')} onMouseUp={(e)=>e.currentTarget.classList.remove('pressed')}>
      <div className="thumb" style={{background:p.color}}></div>
      <div className="proj-info">
        <div className="proj-title">{p.title}</div>
        <div className="proj-desc muted">{p.short}</div>
      </div>
    </div>
  )
}

function Projects({onOpen}){
  const [query,setQuery] = useState('');
  const [filter,setFilter] = useState('all');
  const data = [
    {id:1,title:'Loja E-commerce',short:'Plataforma de vendas em Java + React',tech:['Java','React'],status:'Produção',color:'#4f46e5'},
    {id:2,title:'App Financeiro',short:'App mobile com sincronização e off-line',tech:['Flutter','Spring'],status:'Em andamento',color:'#00d4a6'},
    {id:3,title:'ERP Custom',short:'Automação e integração de processos',tech:['Java','SQL'],status:'Planejado',color:'#ffb86b'}
  ];
  const filtered = data.filter(d=> (filter==='all'||d.tech.includes(filter)) && d.title.toLowerCase().includes(query.toLowerCase()));
  return (
    <div className="view projects">
      <div className="projects-top">
        <h3>Projetos</h3>
        <div className="search-row">
          <input placeholder="Buscar projetos..." value={query} onChange={e=>setQuery(e.target.value)} />
          <select value={filter} onChange={e=>setFilter(e.target.value)}>
            <option value="all">Todos</option>
            <option value="Java">Java</option>
            <option value="React">React</option>
            <option value="Flutter">Flutter</option>
          </select>
        </div>
      </div>
      <div className="projects-grid">
        {filtered.map(p=> <ProjectCard key={p.id} p={p} onOpen={onOpen} />)}
      </div>
    </div>
  )
}

function ProjectDetails({project,onBack}){
  if(!project) return null;
  return (
    <div className="modal-overlay" onClick={onBack}>
      <div className="modal" onClick={e=>e.stopPropagation()}>
        <div className="modal-header"><h3>{project.title}</h3><button className="btn ghost" onClick={onBack}>Fechar</button></div>
        <div className="modal-body">
          <p className="muted">{project.short}</p>
          <div className="tags">{(project.tech||[]).map((t,i)=>(<span key={i} className="badge">{t}</span>))}</div>
          <p>Detalhes do projeto: integrações, testes, APIs e deploy configurado.</p>
        </div>
        <div className="modal-actions"><button className="btn primary">Ver repositório</button></div>
      </div>
    </div>
  )
}

function Explore(){
  const [q,setQ] = useState('');
  const [items] = useState([
    {id:1,title:'Design System Minimal',tags:['Design','UI']},
    {id:2,title:'API Banking',tags:['API','Java']},
    {id:3,title:'Chat Mobile',tags:['Mobile','Flutter']}
  ]);
  const filtered = items.filter(i=>i.title.toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="view explore">
      <h3>Explorar</h3>
      <input placeholder="Buscar..." value={q} onChange={e=>setQ(e.target.value)} />
      <div className="explore-grid">
        {filtered.map(it=> (
          <div key={it.id} className="explore-card">
            <div className="ec-title">{it.title}</div>
            <div className="ec-tags muted">{it.tags.join(' • ')}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function Profile(){
  const [form, setForm] = useState({name:'',email:'',msg:''});
  function send(){
    const text = `Olá usuario, tenho interesse. Nome:${form.name} Email:${form.email} Mensagem:${form.msg}`;
    const phone = '5511997909348';
    window.open(`https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(text)}`,'_blank');
  }
  return (
    <div className="view profile">
      <div className="profile-top">
        <div className="avatar">AE</div>
        <div>
          <h3>usuario</h3>
          <div className="muted">@anaestran • Remoto</div>
        </div>
      </div>
      <p className="muted">Engenheira de software — Full-stack, Java/Spring, APIs e Mobile.</p>
      <div className="profile-stats">
        <div><div className="num">12</div><div className="muted">Projetos</div></div>
        <div><div className="num">8</div><div className="muted">Deploys</div></div>
        <div><div className="num">5</div><div className="muted">Clientes</div></div>
      </div>
      <h4>Tecnologias</h4>
      <div className="badges">
        <span className="badge highlight">Java</span>
        <span className="badge">Spring Boot</span>
        <span className="badge">React</span>
        <span className="badge">Flutter</span>
      </div>
      <h4 style={{marginTop:10}}>Projetos publicados</h4>
      <div className="projects-list">
        <ProjectCard p={{id:1,title:'Loja E-commerce',short:'Plataforma de vendas',color:'#4f46e5'}} onOpen={()=>{}} />
      </div>
      <div className="actions"><button className="btn primary" onClick={send}>Contactar</button></div>
    </div>
  )
}



// Scene component: immersive hero + floating objects
function Scene({onOpen}){
  const [mouse, setMouse] = useState({x:0,y:0});
  const ref = useRef();
  useEffect(()=>{
    function onMove(e){
      const rect = ref.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      setMouse({x,y});
    }
    const root = ref.current;
    root.addEventListener('mousemove', onMove);
    return ()=> root.removeEventListener('mousemove', onMove);
  },[])

  const projects = [
    {id:1,title:'Loja E-commerce',short:'Plataforma de vendas em Java + React',color:'#4f46e5'},
    {id:2,title:'App Financeiro',short:'App mobile com sincronização',color:'#00d4a6'},
    {id:3,title:'ERP Custom',short:'Automação e integração',color:'#ffb86b'}
  ];


  
  return (
    <section className="scene" ref={ref}>
      <TinyNav />
      <div className="hero">
        <h1 className="hero-title">CODEXA</h1>
        <p className="hero-sub">Design & Engineering — produtos digitais com alma.</p>
        <div className="hero-cta">
          <button className="btn primary" onClick={()=>onOpen(projects[0])}>Ver projetos</button>
        </div>
      </div>

      <div className="scene-canvas">
        {/* floating project cards */}
        {projects.map((p,i)=>{
          const fx = mouse.x * (20 + i*8);
          const fy = mouse.y * (14 + i*6);
          const style = {transform:`translate3d(${fx}px,${fy}px,0) rotate(${mouse.x*6}deg)`};
          return (
            <button key={p.id} className="floating-card" style={style} onClick={()=>onOpen(p)} aria-label={`Abrir projeto ${p.title}`}>
              <div className="thumb" style={{background:p.color}}></div>
              <div className="fc-body"><div className="proj-title">{p.title}</div><div className="muted">{p.short}</div></div>
            </button>
          )
        })}

        {/* phone intentionally removed from the scene */}
      </div>
    </section>
  )
}

function CodexaExperience(){
  const [selected, setSelected] = useState(null);
  function openProject(p){ setSelected(p); }
  function close(){ setSelected(null); }

  return (
    <div className="codexa-experience">
      <Scene onOpen={openProject} />
      {selected && <ProjectDetails project={selected} onBack={close} />}
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(<CodexaExperience />);
