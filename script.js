const whatsappNumber = '5511997909348'; // BR country code + number
const whatsappMessageBase = encodeURIComponent('Olá usuario, gostaria de solicitar um orçamento. Segue uma breve descrição: ');
const supabaseClient = window.supabase && window.CODEXA_SUPABASE_URL && window.CODEXA_SUPABASE_KEY
  ? window.supabase.createClient(window.CODEXA_SUPABASE_URL, window.CODEXA_SUPABASE_KEY)
  : null;

document.addEventListener('DOMContentLoaded', ()=>{
  const portfolioFan = document.getElementById('portfolio-fan');
  if(portfolioFan){
    portfolioFan.addEventListener('pointermove', e=>{
      const rect = portfolioFan.getBoundingClientRect();
      const rotateY = ((e.clientX - rect.left) / rect.width - .5) * 5;
      const rotateX = ((e.clientY - rect.top) / rect.height - .5) * -5;
      portfolioFan.style.setProperty('--fan-x', `${rotateY}deg`);
      portfolioFan.style.setProperty('--fan-y', `${rotateX}deg`);
    });
    portfolioFan.addEventListener('pointerleave', ()=>{
      portfolioFan.style.setProperty('--fan-x', '0deg');
      portfolioFan.style.setProperty('--fan-y', '0deg');
    });
    portfolioFan.querySelectorAll('.fan-card').forEach(card=>card.addEventListener('click', openPublicGalleryModal));
  }

  const publicForm = document.getElementById('public-portfolio-form');
  const publicHandle = document.getElementById('public-handle');
  const accessResult = document.getElementById('access-result');

  if(supabaseClient){
    const authCallback = window.location.hash.includes('access_token=') || window.location.hash.includes('type=signup');
    supabaseClient.auth.getSession().then(({data})=>{
      if(data.session && authCallback) showAuthenticatedUser(data.session.user);
    });
    supabaseClient.auth.onAuthStateChange((event, session)=>{
      if(session && event === 'SIGNED_IN'){
        showAuthenticatedUser(session.user);
      }
    });
  }

  function showAuthenticatedUser(user){
    const name = user.user_metadata?.display_name || user.email.split('@')[0];
    const username = user.user_metadata?.username || user.email.split('@')[0].toLowerCase().replace(/[^a-z0-9_.-]/g, '').slice(0, 32);
    supabaseClient.from('profiles').upsert({id:user.id, username, email:user.email, display_name:name}).then(()=>{
      document.getElementById('access-modal')?.remove();
      document.getElementById('dashboard-modal')?.remove();
      openDashboard({id:user.id, name, username, email:user.email, projects:[]});
    });
  }

  if(publicForm) publicForm.addEventListener('submit', e=>{
    e.preventDefault();
    const handle = publicHandle.value.trim().replace(/^@+/, '');
    if(!handle) return;
    const safeHandle = handle.replace(/[^a-zA-Z0-9_.-]/g, '');
    accessResult.innerHTML = `<strong>@${safeHandle}</strong> encontrado. Abrindo galeria pública...`;
    accessResult.classList.add('is-visible');
    window.location.hash = `portfolio-${safeHandle}`;
  });

  document.querySelectorAll('a[href="#publico"]').forEach(link=>{
    link.addEventListener('click', e=>{
      e.preventDefault();
      openPublicGalleryModal();
    });
  });

  function openPublicGalleryModal(){
    if(document.getElementById('public-gallery-modal')) return;
    const modal = document.createElement('div');
    modal.id = 'public-gallery-modal';
    modal.className = 'access-modal gallery-modal';
    modal.innerHTML = `<div class="gallery-dialog" role="dialog" aria-modal="true" aria-labelledby="gallery-title"><button class="modal-close" aria-label="Fechar">×</button><span class="section-kicker">GALERIA PÚBLICA</span><h2 id="gallery-title">Visite um portfólio.</h2><p>Digite o nome de usuário para ver os projetos que essa pessoa decidiu publicar.</p><form class="gallery-search"><span>Nome de usuário</span><div class="gallery-search-row"><span>@</span><input type="search" placeholder="usuario" autocomplete="off" required><button type="submit">Buscar</button></div></form><div class="gallery-grid"></div><small class="gallery-feedback" aria-live="polite"></small></div>`;
    document.body.appendChild(modal);
    const grid = modal.querySelector('.gallery-grid');
    const feedback = modal.querySelector('.gallery-feedback');
    async function searchGallery(event){
      event.preventDefault();
      const input = modal.querySelector('.gallery-search input');
      const button = modal.querySelector('.gallery-search button');
      const username = input.value.trim().replace(/^@+/, '').toLowerCase();
      if(!username) return;
      grid.innerHTML = '<p class="gallery-loading">Buscando portfólio...</p>';
      button.disabled = true;
      if(!supabaseClient){
        grid.innerHTML = '<p class="gallery-empty">A galeria pública precisa estar conectada ao Supabase.</p>';
        button.disabled = false;
        return;
      }
      let {data:profile, error:profileError} = await supabaseClient.from('profiles').select('id,username,display_name').eq('username', username).maybeSingle();
      if(!profile && !profileError && username.includes('@')){
        const legacyProfile = await supabaseClient.from('profiles').select('id,username,display_name').eq('email', username).maybeSingle();
        profile = legacyProfile.data;
        profileError = legacyProfile.error;
      }
      if(profileError || !profile){
        grid.innerHTML = '<p class="gallery-empty">Nenhum usuário encontrado com esse nome.</p>';
        button.disabled = false;
        return;
      }
      const {data:projects, error:projectsError} = await supabaseClient.from('projects').select('title,description,technologies,github_url').eq('user_id', profile.id).eq('is_public', true).order('created_at', {ascending:false});
      button.disabled = false;
      if(projectsError){
        grid.innerHTML = '<p class="gallery-empty">Não foi possível carregar este portfólio.</p>';
        return;
      }
      const displayName = escapeHtml(profile.display_name || profile.username);
      const initials = escapeHtml((profile.display_name || profile.username).slice(0,2).toUpperCase());
      grid.innerHTML = `<div class="public-profile"><span class="gallery-avatar">${initials}</span><strong>${displayName}</strong><small>@${escapeHtml(profile.username)}</small></div>${projects.length ? projects.map(project=>`<article class="gallery-project"><strong>${escapeHtml(project.title)}</strong><p>${escapeHtml(project.description || 'Projeto publicado na CODEXA.')}</p><small>${escapeHtml(project.technologies || 'Tecnologias não informadas')}</small>${project.github_url ? `<a href="${escapeHtml(project.github_url)}" target="_blank" rel="noreferrer">Abrir projeto ↗</a>` : ''}</article>`).join('') : '<p class="gallery-empty">Este usuário ainda não publicou projetos.</p>'}`;
      feedback.textContent = `${projects.length} projeto(s) público(s) encontrado(s).`;
    }
    modal.querySelector('.gallery-search').addEventListener('submit', searchGallery);
    const close = ()=>modal.remove();
    modal.addEventListener('click', e=>{ if(e.target === modal) close(); });
    modal.querySelector('.modal-close').addEventListener('click', close);
  }

  document.querySelectorAll('a[href="#entrar"]').forEach(link=>{
    link.addEventListener('click', e=>{
      e.preventDefault();
      openAccessModal('login');
    });
  });

  document.querySelectorAll('a[href="#criar"]').forEach(link=>{
    link.addEventListener('click', e=>{
      e.preventDefault();
      openAccessModal('register');
    });
  });

  function openAccessModal(mode){
    if(document.getElementById('access-modal')) return;
    const modal = document.createElement('div');
    modal.id = 'access-modal';
    modal.className = 'access-modal';
    const isRegister = mode === 'register';
    modal.innerHTML = `<div class="access-dialog" role="dialog" aria-modal="true" aria-labelledby="access-title"><button class="modal-close" aria-label="Fechar">×</button><span class="section-kicker">${isRegister ? 'CRIAR CONTA' : 'ACESSO CODEXA'}</span><h2 id="access-title">${isRegister ? 'Dê um endereço ao seu trabalho.' : 'Volte para o seu trabalho.'}</h2><p>${isRegister ? 'Crie seu acesso para montar e publicar seu portfólio.' : 'Entre para editar seu portfólio, publicar projetos e compartilhar seu endereço.'}</p>${isRegister ? '<p class="verification-note"><strong>Quase lá.</strong> Depois do cadastro, confira seu e-mail para ativar o acesso.</p>' : ''}<form class="modal-form">${isRegister ? '<label>Como as pessoas encontrarão sua galeria?<input name="username" type="text" pattern="[a-z0-9_.\\-]{3,32}" minlength="3" maxlength="32" required placeholder="seu-nome-publico"><small class="field-hint">Esse nome aparecerá no link que você compartilhar.</small><small class="username-availability" aria-live="polite"></small></label>' : ''}<label>E-mail<input name="email" type="email" required placeholder="voce@email.com"></label><label>Senha<input name="password" type="password" minlength="6" required placeholder="Mínimo de 6 caracteres"></label><button class="button button-primary" type="submit">${isRegister ? 'Criar conta' : 'Entrar'} <span>→</span></button></form><small class="access-feedback" aria-live="polite"></small><button class="modal-switch" type="button">${isRegister ? 'Já tenho uma conta' : 'Ainda não tenho uma conta'}</button></div>`;
    document.body.appendChild(modal);
    const close = ()=>modal.remove();
    modal.addEventListener('click', e=>{ if(e.target === modal) close(); });
    modal.querySelector('.modal-close').addEventListener('click', close);
    modal.querySelector('.modal-switch').addEventListener('click', ()=>{ close(); openAccessModal(isRegister ? 'login' : 'register'); });
    const usernameInput = modal.querySelector('[name="username"]');
    const availability = modal.querySelector('.username-availability');
    async function checkUsernameAvailability(){
      if(!isRegister || !usernameInput) return false;
      const username = usernameInput.value.trim().toLowerCase();
      if(!/^[a-z0-9_.-]{3,32}$/.test(username)){
        availability.textContent = username ? 'Use de 3 a 32 caracteres válidos.' : '';
        availability.className = 'username-availability';
        return false;
      }
      availability.textContent = 'Verificando disponibilidade...';
      availability.className = 'username-availability is-checking';
      const {data, error} = await supabaseClient.from('profiles').select('id').eq('username', username).maybeSingle();
      if(error){ availability.textContent = 'Não foi possível verificar agora.'; availability.className = 'username-availability is-unavailable'; return false; }
      const available = !data;
      availability.textContent = available ? 'Nome disponível.' : 'Esse nome já está em uso.';
      availability.className = `username-availability ${available ? 'is-available' : 'is-unavailable'}`;
      return available;
    }
    if(usernameInput) usernameInput.addEventListener('blur', checkUsernameAvailability);
    modal.querySelector('form').addEventListener('submit', async e=>{
      e.preventDefault();
      const formData = new FormData(e.currentTarget);
      const email = String(formData.get('email')).trim().toLowerCase();
      const password = String(formData.get('password'));
      const feedback = modal.querySelector('.access-feedback');
      const username = String(formData.get('username') || '').trim().toLowerCase();
      if(isRegister && !/^[a-z0-9_.-]{3,32}$/.test(username)){
        feedback.textContent = 'Escolha um nome de usuário com 3 a 32 caracteres, usando letras, números, ponto, hífen ou sublinhado.';
        return;
      }
      if(isRegister && supabaseClient && !(await checkUsernameAvailability())){
        feedback.textContent = 'Escolha outro nome público para continuar.';
        return;
      }

      if(supabaseClient){
        const submitButton = e.currentTarget.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.innerHTML = 'Aguarde...';
        const authRequest = isRegister
          ? supabaseClient.auth.signUp({email, password, options:{data:{display_name:String(formData.get('name')).trim(), username}}})
          : supabaseClient.auth.signInWithPassword({email, password});
        authRequest.then(({data, error})=>{
          if(error){
            const message = error.message.toLowerCase();
            if(message.includes('email not confirmed')) feedback.textContent = 'Seu e-mail ainda não foi confirmado. Verifique sua caixa de entrada.';
            else if(message.includes('invalid login credentials')) feedback.textContent = 'E-mail ou senha incorretos.';
            else if(message.includes('rate limit')) feedback.textContent = 'Muitas tentativas. Aguarde alguns minutos e tente novamente.';
            else if(message.includes('already registered')) feedback.textContent = 'Este e-mail já está cadastrado. Entre na sua conta.';
            else feedback.textContent = 'Não foi possível concluir o acesso. Confira os dados e tente novamente.';
            submitButton.disabled = false;
            submitButton.innerHTML = `${isRegister ? 'Criar conta' : 'Entrar'} <span>→</span>`;
            return;
          }
          const user = data.user;
          if(isRegister && !data.session){
            feedback.textContent = 'Conta criada. Confirme seu e-mail para entrar.';
            submitButton.disabled = false;
            submitButton.innerHTML = 'Criar conta <span>→</span>';
            return;
          }
          if(isRegister){
            supabaseClient.from('profiles').upsert({id:user.id, username, email:user.email, display_name:user.user_metadata?.display_name || username});
          }
          close();
          openDashboard({id:user.id, name:user.user_metadata?.display_name || user.email.split('@')[0], username:user.user_metadata?.username || user.email.split('@')[0], email:user.email, projects:[]});
        });
        return;
      }
      const account = JSON.parse(localStorage.getItem('codexa-account') || 'null');

      if(isRegister){
        if(account && account.email === email){
          feedback.textContent = 'Este e-mail já está cadastrado. Entre na sua conta.';
          return;
        }
        const newAccount = {name:String(formData.get('name')).trim(), username, email, password, projects:[]};
        localStorage.setItem('codexa-account', JSON.stringify(newAccount));
        localStorage.setItem('codexa-session', JSON.stringify({email:newAccount.email, name:newAccount.name}));
        close();
        openDashboard(newAccount);
        return;
      }

      if(!account){
        feedback.textContent = 'Nenhuma conta encontrada. Crie sua conta primeiro.';
        return;
      }
      if(account.email !== email || account.password !== password){
        feedback.textContent = 'E-mail ou senha incorretos.';
        return;
      }
      localStorage.setItem('codexa-session', JSON.stringify({email:account.email, name:account.name}));
      close();
      openDashboard(account);
    });
  }

  function openDashboard(account){
    if(document.getElementById('dashboard-modal')) return;
    const modal = document.createElement('div');
    modal.id = 'dashboard-modal';
    modal.className = 'access-modal dashboard-modal';
    modal.innerHTML = `<div class="dashboard-dialog" role="dialog" aria-modal="true" aria-labelledby="dashboard-title"><button class="modal-close" aria-label="Fechar">×</button><div class="dashboard-heading"><div><span class="section-kicker">MEU PORTFÓLIO</span><h2 id="dashboard-title">Olá, ${escapeHtml(account.name)}.</h2><p>Escolha o que outras pessoas podem encontrar na sua galeria.</p></div><button class="dashboard-logout" type="button">Sair</button></div><div class="dashboard-handle">codexa.com/@${escapeHtml(account.username || account.email.split('@')[0])}</div><div class="dashboard-projects"></div><form class="project-form" hidden><span class="section-kicker">PERSONALIZAR PROJETO</span><label>Nome do projeto<input name="title" required placeholder="Ex.: Plataforma financeira"></label><label>Descrição<textarea name="description" rows="3" placeholder="Conte brevemente o que você criou"></textarea></label><label>Tecnologias usadas<input name="tags" placeholder="Java · React · PostgreSQL"></label><label>Repositório do GitHub<input name="link" type="url" placeholder="https://github.com/usuario/projeto"></label><fieldset class="project-visibility"><legend>Visibilidade</legend><button type="button" class="visibility-choice is-selected" data-public="false" aria-pressed="true">Privado</button><button type="button" class="visibility-choice" data-public="true" aria-pressed="false">Público</button></fieldset><div class="project-form-actions"><button class="button button-primary" type="submit">Salvar projeto</button><button class="project-cancel" type="button">Cancelar</button></div></form><button class="button button-primary dashboard-add" type="button">Novo projeto <span>+</span></button></div>`;
    modal.innerHTML = `<div class="dashboard-dialog" role="dialog" aria-modal="true" aria-labelledby="dashboard-title"><button class="modal-close" aria-label="Fechar">×</button><div class="dashboard-heading"><div><span class="section-kicker">MEU PORTFÓLIO</span><h2 id="dashboard-title">Olá, ${escapeHtml(account.name)}.</h2><p>Escolha o que outras pessoas podem encontrar na sua galeria.</p></div><div class="dashboard-heading-actions"><button class="dashboard-settings" type="button">Configurações</button><button class="dashboard-logout" type="button">Sair</button></div></div><div class="dashboard-handle">codexa.com/@${escapeHtml(account.username || account.email.split('@')[0])}</div><form class="profile-form" hidden><span class="section-kicker">CONFIGURAÇÕES DO USUÁRIO</span><label>Nome exibido<input name="display_name" required></label><label>Nome para encontrar sua galeria<input name="username" pattern="[a-z0-9_.\\-]{3,32}" minlength="3" maxlength="32" required></label><div class="project-form-actions"><button class="button button-primary" type="submit">Salvar configurações</button><button class="profile-cancel" type="button">Cancelar</button></div></form><div class="dashboard-projects"></div><form class="project-form" hidden><span class="section-kicker">PERSONALIZAR PROJETO</span><label>Nome do projeto<input name="title" required placeholder="Ex.: Plataforma financeira"></label><label>Descrição<textarea name="description" rows="3" placeholder="Conte brevemente o que você criou"></textarea></label><label>Tecnologias usadas<input name="tags" placeholder="Java · React · PostgreSQL"></label><label>Link do projeto<input name="link" type="url" placeholder="https://seu-projeto.com"></label><fieldset class="project-visibility"><legend>Visibilidade</legend><button type="button" class="visibility-choice is-selected" data-public="false" aria-pressed="true">Privado</button><button type="button" class="visibility-choice" data-public="true" aria-pressed="false">Público</button></fieldset><div class="project-form-actions"><button class="button button-primary" type="submit">Salvar projeto</button><button class="project-cancel" type="button">Cancelar</button></div></form><button class="button button-primary dashboard-add" type="button">Novo projeto <span>+</span></button></div>`;
    document.body.appendChild(modal);
    const projects = (account.projects || []).filter(project=>project.tags !== 'Novo projeto · CODEXA' && !/^Projeto \d+$/.test(project.title));
    const projectList = modal.querySelector('.dashboard-projects');
    const saveProjects = ()=>{
      const currentAccount = JSON.parse(localStorage.getItem('codexa-account') || 'null');
      if(currentAccount){
        currentAccount.projects = projects;
        localStorage.setItem('codexa-account', JSON.stringify(currentAccount));
      }
    };
    function renderProjects(){
      projectList.innerHTML = projects.length ? projects.map((project,index)=>`<article class="dashboard-project"><div><strong>${escapeHtml(project.title)}</strong><small>${escapeHtml(project.description || project.tags || 'Projeto CODEXA')}</small></div><div class="project-actions"><button class="project-edit" type="button" data-index="${index}">Editar</button><button class="visibility-toggle ${project.public ? 'is-public' : ''}" type="button" data-index="${index}">${project.public ? 'Público' : 'Privado'}</button></div></article>`).join('') : '<div class="dashboard-empty"><strong>Sua galeria está vazia.</strong><span>Adicione seu primeiro projeto para começar.</span></div>';
      projectList.querySelectorAll('.project-edit').forEach(button=>button.addEventListener('click', ()=>editProject(Number(button.dataset.index))));
      projectList.querySelectorAll('.visibility-toggle').forEach(button=>button.addEventListener('click', ()=>{
        const project = projects[Number(button.dataset.index)];
        project.public = !project.public;
        if(supabaseClient && account.id && project.id){
          supabaseClient.from('projects').update({is_public:project.public}).eq('id', project.id).eq('user_id', account.id);
        }
        saveProjects();
        renderProjects();
      }));
    }
    renderProjects();
    if(supabaseClient && account.id){
      supabaseClient.from('projects').select('id,title,description,technologies,github_url,is_public').eq('user_id', account.id).order('created_at', {ascending:false}).then(({data, error})=>{
        if(!error && data){
          projects.splice(0, projects.length, ...data.map(project=>({id:project.id, title:project.title, description:project.description || '', tags:project.technologies || '', link:project.github_url || '', public:project.is_public})));
          renderProjects();
        }
      });
    }
    const projectForm = modal.querySelector('.project-form');
    let projectIsPublic = false;
    let editingIndex = null;
    function editProject(index){
      const project = projects[index];
      editingIndex = index;
      projectForm.hidden = false;
      modal.querySelector('.dashboard-add').hidden = true;
      projectForm.querySelector('.section-kicker').textContent = 'EDITAR PROJETO';
      projectForm.querySelector('[name="title"]').value = project.title;
      projectForm.querySelector('[name="description"]').value = project.description || '';
      projectForm.querySelector('[name="tags"]').value = project.tags || '';
      projectForm.querySelector('[name="link"]').value = project.link || '';
      projectIsPublic = Boolean(project.public);
      projectForm.querySelectorAll('.visibility-choice').forEach(option=>{
        const selected = option.dataset.public === String(projectIsPublic);
        option.classList.toggle('is-selected', selected);
        option.setAttribute('aria-pressed', String(selected));
      });
      projectForm.querySelector('[name="title"]').focus();
    }
    projectForm.querySelectorAll('.visibility-choice').forEach(choice=>choice.addEventListener('click', ()=>{
      projectIsPublic = choice.dataset.public === 'true';
      projectForm.querySelectorAll('.visibility-choice').forEach(option=>{
        const selected = option.dataset.public === String(projectIsPublic);
        option.classList.toggle('is-selected', selected);
        option.setAttribute('aria-pressed', String(selected));
      });
    }));
    modal.querySelector('.dashboard-add').addEventListener('click', ()=>{
      projectForm.hidden = false;
      modal.querySelector('.dashboard-add').hidden = true;
      projectForm.querySelector('[name="title"]').focus();
    });
    projectForm.addEventListener('submit', e=>{
      e.preventDefault();
      const formData = new FormData(projectForm);
      const project = {title:String(formData.get('title')).trim(), description:String(formData.get('description')).trim(), tags:String(formData.get('tags')).trim(), link:String(formData.get('link')).trim(), public:projectIsPublic};
      if(editingIndex !== null && supabaseClient && account.id && projects[editingIndex].id){
        supabaseClient.from('projects').update({title:project.title, description:project.description, technologies:project.tags, github_url:project.link, is_public:project.public}).eq('id', projects[editingIndex].id).eq('user_id', account.id).then(({error})=>{
          if(error){ window.alert('Não foi possível atualizar o projeto.'); return; }
          projects[editingIndex] = {...projects[editingIndex], ...project};
          finishProjectForm();
        });
      } else if(editingIndex !== null) {
        projects[editingIndex] = {...projects[editingIndex], ...project};
        saveProjects();
        finishProjectForm();
      } else if(supabaseClient && account.id){
        supabaseClient.from('projects').insert({user_id:account.id, title:project.title, description:project.description, technologies:project.tags, github_url:project.link, is_public:project.public}).select().single().then(({data, error})=>{
          if(error){ window.alert('Não foi possível salvar o projeto no Supabase.'); return; }
          projects.unshift({...project, id:data.id});
          finishProjectForm();
        });
      } else {
        projects.push(project);
        saveProjects();
        finishProjectForm();
      }
    });
    function finishProjectForm(){
      projectForm.reset();
      projectIsPublic = false;
      projectForm.hidden = true;
      modal.querySelector('.dashboard-add').hidden = false;
      editingIndex = null;
      projectForm.querySelector('.section-kicker').textContent = 'PERSONALIZAR PROJETO';
      renderProjects();
    }
    projectForm.querySelector('.project-cancel').addEventListener('click', ()=>{
      projectForm.reset();
      projectForm.hidden = true;
      modal.querySelector('.dashboard-add').hidden = false;
    });
    const profileForm = modal.querySelector('.profile-form');
    const profileFeedback = document.createElement('small');
    profileFeedback.className = 'profile-feedback';
    profileForm.appendChild(profileFeedback);
    profileForm.querySelector('[name="display_name"]').value = account.name || '';
    profileForm.querySelector('[name="username"]').value = account.username || account.email.split('@')[0];
    modal.querySelector('.dashboard-settings').addEventListener('click', ()=>{
      profileForm.hidden = !profileForm.hidden;
      if(!profileForm.hidden) profileForm.querySelector('[name="username"]').focus();
    });
    profileForm.addEventListener('submit', async e=>{
      e.preventDefault();
      const formData = new FormData(profileForm);
      const displayName = String(formData.get('display_name')).trim();
      const username = String(formData.get('username')).trim().toLowerCase();
      if(!/^[a-z0-9_.-]{3,32}$/.test(username)){
        profileFeedback.textContent = 'Use de 3 a 32 caracteres: letras, números, ponto, hífen ou sublinhado.';
        return;
      }
      if(supabaseClient && account.id){
        const {error} = await supabaseClient.from('profiles').update({display_name:displayName, username}).eq('id', account.id);
        if(error){ profileFeedback.textContent = 'Esse nome público já pode estar em uso.'; return; }
      }
      account.name = displayName;
      account.username = username;
      saveProjects();
      modal.querySelector('#dashboard-title').textContent = `Olá, ${displayName}.`;
      modal.querySelector('.dashboard-handle').textContent = `codexa.com/@${username}`;
      profileFeedback.textContent = 'Configurações salvas.';
    });
    profileForm.querySelector('.profile-cancel').addEventListener('click', ()=>{ profileForm.hidden = true; });
    const close = ()=>modal.remove();
    modal.addEventListener('click', e=>{ if(e.target === modal) close(); });
    modal.querySelector('.modal-close').addEventListener('click', close);
    modal.querySelector('.dashboard-logout').addEventListener('click', ()=>{
      localStorage.removeItem('codexa-session');
      close();
    });
  }

  // interactive site title effect
  const siteTitle = document.getElementById('site-title');
  if(siteTitle){
    siteTitle.addEventListener('click', ()=>{
      siteTitle.animate([
        { transform: 'rotate(-4deg) scale(1)' },
        { transform: 'rotate(6deg) scale(1.03)' },
        { transform: 'rotate(0deg) scale(1)' }
      ], { duration: 520, easing: 'ease-out' });
    })
  }

  // phone proximity vibration
  const phone = document.getElementById('phone');
  if(phone){
    let vibTimeout = null;
    let awakeTimeout = null;
    let typingStarted = false;
    document.addEventListener('mousemove', (e)=>{
      const rect = phone.getBoundingClientRect();
      const cx = rect.left + rect.width/2;
      const cy = rect.top + rect.height/2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const dist = Math.sqrt(dx*dx + dy*dy);
      const threshold = Math.max(140, rect.width*0.6);
      if(dist < threshold){
        if(!phone.classList.contains('vibrate')){
          phone.classList.add('vibrate');
        }
        if(!phone.classList.contains('awake')) phone.classList.add('awake');
        // start typing animation once when awoken
        if(!typingStarted){ typingStarted = true; startTyping(); }
        // keep vibrating briefly while near
        clearTimeout(vibTimeout);
        vibTimeout = setTimeout(()=> phone.classList.remove('vibrate'), 300);
        clearTimeout(awakeTimeout);
        awakeTimeout = setTimeout(()=> phone.classList.remove('awake'), 2200);
      }
    });

    // CTA inside phone
    const cta = document.querySelector('.cta-button');
    if(cta){
      cta.addEventListener('click', ()=>{
        window.location.href = 'contact.html';
      })
    }
  }
  
  // typing animation inside phone
  function startTyping(){
    const el = document.getElementById('typing');
    const cursor = document.getElementById('cursor');
    if(!el) return;
    const lines = ['Acessando portfolio...', 'Carregando interface...', 'Bem-vindo(a)!'];
    let li = 0; let ci = 0;
    function step(){
      if(li >= lines.length) return void (cursor.style.display='none');
      const line = lines[li];
      el.textContent = line.slice(0,ci+1);
      ci++;
      if(ci < line.length) setTimeout(step, 60);
      else { ci = 0; li++; setTimeout(step, 600); }
    }
    step();
  }
  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(a=>{
    a.addEventListener('click', e=>{
      e.preventDefault();
      const tgt = document.querySelector(a.getAttribute('href'));
      if(tgt) tgt.scrollIntoView({behavior:'smooth',block:'start'});
    })
  })

  // WhatsApp CTA
  const waBtn = document.getElementById('whatsapp-quote');
  const waLink = document.getElementById('whatsapp-link');
  const whatsappPhone = whatsappNumber;
  const pre = whatsappMessageBase;
  function buildWaUrl(msg){
    return `https://api.whatsapp.com/send?phone=${whatsappPhone}&text=${encodeURIComponent(msg)}`;
  }
  if(waBtn) waBtn.addEventListener('click', ()=>{
    const msg = pre + 'Orçamento via site.';
    window.open(buildWaUrl(msg),'_blank');
  })
  if(waLink) waLink.addEventListener('click', ()=>{ window.open(buildWaUrl('Olá, vi seu portfólio. Quero conversar.'),'_blank') })

  // Terminal logic
  const termInput = document.getElementById('term-input');
  const termOutput = document.getElementById('term-output');
  document.querySelectorAll('.term-buttons button').forEach(b=>{
    b.addEventListener('click', ()=>runCommand(b.dataset.cmd));
  })
  if(termInput) termInput.addEventListener('keydown', e=>{
    if(e.key === 'Enter'){
      runCommand(termInput.value.trim());
      termInput.value = '';
    }
  })

  function runCommand(cmd){
    if(!cmd) return showOutput('Digite um comando.');
    const c = cmd.toLowerCase();
    showOutput('> ' + c);
    setTimeout(()=>{
      switch(c){
        case 'help':
          showOutput('Comandos: help, skills, contact, services, linkedin');
          break;
        case 'skills':
          showOutput('Principais: Java (Spring), JavaScript, TypeScript, Python, C#, SQL, HTML/CSS');
          break;
        case 'contact':
          showOutput('Abra o formulário de contato abaixo ou envie mensagem via WhatsApp.');
          document.querySelector('#contact').scrollIntoView({behavior:'smooth'});
          break;
        case 'services':
          showOutput('Serviços: Web Apps, Mobile, APIs Java/Spring Boot, Automações.');
          break;
        case 'linkedin':
          window.open('https://www.linkedin.com/in/ana-estran-994853365','_blank');
          showOutput('Abrindo LinkedIn...');
          break;
        default:
          showOutput(`Comando não encontrado: ${c}`);
      }
    }, 350);
  }

  function showOutput(text){
    if(termOutput) termOutput.innerHTML = `<div>${escapeHtml(text)}</div>`;
  }

  function escapeHtml(s){return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}

  // Form handling
  const form = document.getElementById('quote-form');
  if(form) form.addEventListener('submit', e=>{
    e.preventDefault();
    const fd = new FormData(form);
    const name = fd.get('name')||'';
    const email = fd.get('email')||'';
    const type = fd.get('type')||'';
    const message = fd.get('message')||'';
    const full = `Nome: ${name}\nE-mail: ${email}\nTipo: ${type}\nMensagem: ${message}`;
    const waMsg = `Olá usuario, gostaria de um orçamento.\n\n${full}`;
    window.open(buildWaUrl(waMsg),'_blank');
  })

  // Mailto button
  const mailtoButton = document.getElementById('mailto-btn');
  if(mailtoButton) mailtoButton.addEventListener('click', ()=>{
    const f = new FormData(document.getElementById('quote-form'));
    const subject = encodeURIComponent('Orçamento - CODEXA');
    const body = encodeURIComponent(`Olá usuario,\n\nNome: ${f.get('name')||''}\nE-mail: ${f.get('email')||''}\nTipo: ${f.get('type')||''}\n\n${f.get('message')||''}`);
    window.location.href = `mailto:seu-email@exemplo.com?subject=${subject}&body=${body}`;
  })
});

// small helper: active tab switch (visual)
document.addEventListener('click', e=>{
  if(e.target.classList && e.target.classList.contains('tab')){
    document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
    e.target.classList.add('active');
  }
});
