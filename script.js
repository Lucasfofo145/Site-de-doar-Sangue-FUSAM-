/**
 * FUSAM Sangue Bom - Script Principal
 * Funcionalidades:
 * 1. Navegação Responsiva & Rolagem Suave
 * 2. Painel Visual de Estoque com Modo Simulação (Admin)
 * 3. Simulador Interativo de Aptidão Passo a Passo
 * 4. Cadastro de Doadores de Emergência com Armazenamento Local
 */

document.addEventListener('DOMContentLoaded', () => {

  /* ==========================================================================
     1. Navegação, Menu Mobile & Rolagem Suave
     ========================================================================== */
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const mainNav = document.getElementById('mainNav');
  const navLinks = document.querySelectorAll('.nav-link, .smooth-scroll-btn, .top-bar-link');

  if (mobileMenuBtn && mainNav) {
    mobileMenuBtn.addEventListener('click', () => {
      const isExpanded = mobileMenuBtn.getAttribute('aria-expanded') === 'true';
      mobileMenuBtn.setAttribute('aria-expanded', !isExpanded);
      mainNav.classList.toggle('mobile-open');
    });
  }

  // Rolagem suave e fechamento do menu móvel ao clicar em âncoras
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      const targetId = link.getAttribute('href');
      if (targetId && targetId.startsWith('#')) {
        e.preventDefault();
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
          // Fecha menu mobile se aberto
          if (mainNav && mainNav.classList.contains('mobile-open')) {
            mainNav.classList.remove('mobile-open');
            mobileMenuBtn.setAttribute('aria-expanded', 'false');
          }

          const headerOffset = 70;
          const elementPosition = targetElement.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });
        }
      }
    });
  });

  /* ==========================================================================
     2. Painel Visual de Estoque & Modo Simulação (Admin)
     ========================================================================== */
  
  // Dados iniciais com quantidade de bolsas reais/estimadas e níveis
  const DEFAULT_STOCK = [
    { type: 'O-', percent: 20, bags: 4, note: 'Doador Universal' },
    { type: 'A-', percent: 20, bags: 5, note: 'Apenas A e AB' },
    { type: 'O+', percent: 50, bags: 18, note: 'Mais Demandado' },
    { type: 'B-', percent: 50, bags: 6, note: 'Raro' },
    { type: 'A+', percent: 85, bags: 28, note: 'Muito Frequente' },
    { type: 'B+', percent: 90, bags: 22, note: 'Frequente' },
    { type: 'AB-', percent: 85, bags: 10, note: 'Raro' },
    { type: 'AB+', percent: 95, bags: 16, note: 'Receptor Universal' }
  ];

  const STORAGE_KEY_STOCK = 'fusam_blood_stock_v2';
  const STORAGE_KEY_STOCK_TIME = 'fusam_blood_stock_updated_v2';

  function formatCurrentTimestamp() {
    return new Date().toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Carrega do localStorage ou usa o padrão
  function getStockData() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_STOCK);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Erro ao ler estoque do localStorage, usando valores padrão.', e);
    }
    return JSON.parse(JSON.stringify(DEFAULT_STOCK));
  }

  function saveStockData(data) {
    try {
      const now = formatCurrentTimestamp();
      localStorage.setItem(STORAGE_KEY_STOCK, JSON.stringify(data));
      localStorage.setItem(STORAGE_KEY_STOCK_TIME, now);
      updateStockTimestampUI(now);
    } catch (e) {
      console.warn('Erro ao salvar no localStorage.', e);
    }
  }

  function updateStockTimestampUI(timeStr) {
    const el = document.getElementById('stockUpdatedTime');
    if (!el) return;
    const savedTime = timeStr || localStorage.getItem(STORAGE_KEY_STOCK_TIME);
    el.textContent = savedTime || formatCurrentTimestamp();
  }

  let currentStock = getStockData();

  function updateTopBarAlert() {
    const alertTextEl = document.getElementById('topBarAlertText');
    if (!alertTextEl) return;
    const criticalTypes = currentStock.filter(item => item.percent <= 30).map(item => `<strong>${item.type}</strong>`);
    if (criticalTypes.length > 0) {
      alertTextEl.innerHTML = `<strong>Atenção Caçapava:</strong> Estoques dos tipos ${criticalTypes.join(', ')} estão em nível crítico hoje.`;
    } else {
      alertTextEl.innerHTML = `<strong>Hospital FUSAM Caçapava:</strong> Doe sangue regularmente e ajude a manter nossos estoques estáveis.`;
    }
  }

  // Determina status com base no percentual
  // Crítico: <= 30%, Alerta: 31% a 69%, Estável: >= 70%
  function getStatusInfo(percent) {
    if (percent <= 30) {
      return {
        key: 'critical',
        label: 'Crítico',
        colorClass: 'critical',
        badgeClass: 'badge-critical'
      };
    } else if (percent < 70) {
      return {
        key: 'alert',
        label: 'Alerta',
        colorClass: 'alert',
        badgeClass: 'badge-alert'
      };
    } else {
      return {
        key: 'stable',
        label: 'Estável',
        colorClass: 'stable',
        badgeClass: 'badge-stable'
      };
    }
  }

  const stockGrid = document.getElementById('stockGrid');
  const adminSlidersContainer = document.getElementById('adminSlidersContainer');

  // Renderiza os 8 cards no grid
  function renderStockGrid() {
    if (!stockGrid) return;
    stockGrid.innerHTML = '';

    currentStock.forEach(item => {
      const status = getStatusInfo(item.percent);

      const card = document.createElement('div');
      card.className = `stock-card ${status.colorClass}`;
      card.setAttribute('data-blood-type', item.type);

      card.innerHTML = `
        <div class="stock-card-top">
          <div class="stock-blood-group">
            <span class="blood-type-tag">${item.type}</span>
            ${item.note ? `<span class="blood-donor-badge">${item.note}</span>` : ''}
          </div>
          <span class="stock-badge ${status.badgeClass}">${status.label}</span>
        </div>

        <div class="stock-progress-container">
          <div class="stock-progress-track">
            <div class="stock-progress-fill" style="width: ${item.percent}%;" role="progressbar" aria-valuenow="${item.percent}" aria-valuemin="0" aria-valuemax="100" aria-label="Nível do sangue ${item.type}"></div>
          </div>
          <div class="stock-progress-info">
            <span class="stock-percent">${item.percent}%</span>
            <span class="stock-bags-badge">${item.bags ?? 0} ${(item.bags === 1) ? 'bolsa' : 'bolsas'}</span>
          </div>
        </div>
      `;

      stockGrid.appendChild(card);
    });
    updateTopBarAlert();
  }

  // Renderiza os controles de bolsas, nível e percentual dentro do modal de gestão
  function renderAdminSliders() {
    if (!adminSlidersContainer) return;
    adminSlidersContainer.innerHTML = '';

    currentStock.forEach((item, index) => {
      const status = getStatusInfo(item.percent);

      const div = document.createElement('div');
      div.className = 'admin-stock-card';
      div.innerHTML = `
        <div class="admin-slider-header">
          <span class="admin-blood-name">Tipo ${item.type}</span>
          <span class="admin-percent-val" id="adminVal_${index}" style="color: ${status.key === 'critical' ? '#D92525' : status.key === 'alert' ? '#D97706' : '#059669'}">${item.percent}% (${status.label})</span>
        </div>
        <div class="admin-stock-controls">
          <label class="admin-bags-group">
            <span>Bolsas:</span>
            <input type="number" class="admin-bags-input" id="adminBags_${index}" min="0" max="500" value="${item.bags ?? 0}" aria-label="Quantidade de bolsas para ${item.type}">
          </label>
          <select class="admin-level-select" id="adminLevel_${index}" aria-label="Nível de estoque para ${item.type}">
            <option value="critical" ${status.key === 'critical' ? 'selected' : ''}>Crítico</option>
            <option value="alert" ${status.key === 'alert' ? 'selected' : ''}>Alerta</option>
            <option value="stable" ${status.key === 'stable' ? 'selected' : ''}>Estável</option>
          </select>
        </div>
        <input 
          type="range" 
          class="admin-range-input" 
          id="adminRange_${index}" 
          min="0" 
          max="100" 
          value="${item.percent}"
          aria-label="Ajustar percentual para ${item.type}"
        >
      `;

      const rangeInput = div.querySelector(`#adminRange_${index}`);
      const bagsInput = div.querySelector(`#adminBags_${index}`);
      const levelSelect = div.querySelector(`#adminLevel_${index}`);
      const label = div.querySelector(`#adminVal_${index}`);

      function syncAdminLabel(val) {
        const newStatus = getStatusInfo(val);
        if (label) {
          label.textContent = `${val}% (${newStatus.label})`;
          label.style.color = newStatus.key === 'critical' ? '#D92525' : newStatus.key === 'alert' ? '#D97706' : '#059669';
        }
        if (levelSelect) levelSelect.value = newStatus.key;
      }

      rangeInput.addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10);
        item.percent = val;
        syncAdminLabel(val);
        renderStockGrid();
      });

      bagsInput.addEventListener('input', (e) => {
        const bags = Math.max(0, parseInt(e.target.value, 10) || 0);
        item.bags = bags;
        renderStockGrid();
      });

      levelSelect.addEventListener('change', (e) => {
        const lvl = e.target.value;
        const presetPercent = lvl === 'critical' ? 20 : lvl === 'alert' ? 50 : 85;
        item.percent = presetPercent;
        rangeInput.value = presetPercent;
        syncAdminLabel(presetPercent);
        renderStockGrid();
      });

      adminSlidersContainer.appendChild(div);
    });
  }

  // Controles do Modal Admin
  const adminModal = document.getElementById('adminModal');
  const btnOpenAdminModal = document.getElementById('btnOpenAdminModal');
  const btnCloseAdminModal = document.getElementById('btnCloseAdminModal');
  const btnApplyAdminModal = document.getElementById('btnApplyAdminModal');
  const btnResetStockDefault = document.getElementById('btnResetStockDefault');

  if (btnOpenAdminModal && adminModal) {
    btnOpenAdminModal.addEventListener('click', () => {
      renderAdminSliders();
      adminModal.style.display = 'flex';
      btnOpenAdminModal.setAttribute('aria-expanded', 'true');
    });
  }

  function closeAdminModal() {
    if (adminModal) {
      adminModal.style.display = 'none';
      if (btnOpenAdminModal) btnOpenAdminModal.setAttribute('aria-expanded', 'false');
      saveStockData(currentStock);
    }
  }

  if (btnCloseAdminModal) btnCloseAdminModal.addEventListener('click', closeAdminModal);
  if (btnApplyAdminModal) {
    btnApplyAdminModal.addEventListener('click', () => {
      closeAdminModal();
      showToast('Estoque atualizado em tempo real com sucesso!', 'success');
    });
  }

  if (btnResetStockDefault) {
    btnResetStockDefault.addEventListener('click', () => {
      currentStock = JSON.parse(JSON.stringify(DEFAULT_STOCK));
      saveStockData(currentStock);
      renderStockGrid();
      renderAdminSliders();
      showToast('Níveis padrão de estoque restaurados.', 'info');
    });
  }

  // Fechar modal ao clicar fora
  window.addEventListener('click', (e) => {
    if (e.target === adminModal) {
      closeAdminModal();
    }
  });

  // Inicializa Grid de Estoque e Horário
  renderStockGrid();
  updateStockTimestampUI();


  /* ==========================================================================
     3. Simulador Interativo de Aptidão (Wizard Inteligente & Personalizado)
     ========================================================================== */

  // Estado centralizado do Wizard
  const wizardState = {
    currentStep: 1,
    totalSteps: 6,
    age: null,
    weight: null,
    gender: 'M',          // 'M' ou 'F'
    isFirstTime: true,
    lastDonationDate: '',
    donationIntervalData: {
      isBlocked: false,
      daysSince: 0,
      daysNeeded: 60,
      daysRemaining: 0,
      allowedDateFormatted: ''
    },
    selectedConditions: new Set(['none']),
    vaccine: 'none',
    travel: 'none',
    habits: {
      sleep: true,
      alcohol: false,
      meal: true
    }
  };

  const stepMeta = [
    { number: 1, name: 'Idade do Doador', percent: 17 },
    { number: 2, name: 'Peso Corporal', percent: 33 },
    { number: 3, name: 'Gênero & Histórico', percent: 50 },
    { number: 4, name: 'Saúde & Procedimentos', percent: 67 },
    { number: 5, name: 'Vacinas & Viagens', percent: 83 },
    { number: 6, name: 'Preparação para Hoje', percent: 100 }
  ];

  // Elementos do Wizard
  const wizardStepText = document.getElementById('wizardStepText');
  const wizardStepName = document.getElementById('wizardStepName');
  const wizardPercentText = document.getElementById('wizardPercentText');
  const wizardProgressBar = document.getElementById('wizardProgressBar');
  const btnWizardPrev = document.getElementById('btnWizardPrev');
  const btnWizardNext = document.getElementById('btnWizardNext');
  const wizardContent = document.getElementById('wizardContent');
  const wizardResult = document.getElementById('wizardResult');

  // Elementos da Etapa 1 (Idade)
  const inputAge = document.getElementById('inputAge');
  const feedbackAge = document.getElementById('feedbackAge');

  // Elementos da Etapa 2 (Peso)
  const inputWeight = document.getElementById('inputWeight');
  const feedbackWeight = document.getElementById('feedbackWeight');

  // Elementos da Etapa 3 (Gênero e Doação)
  const btnGenderM = document.getElementById('btnGenderM');
  const btnGenderF = document.getElementById('btnGenderF');
  const btnFirstTimeYes = document.getElementById('btnFirstTimeYes');
  const btnFirstTimeNo = document.getElementById('btnFirstTimeNo');
  const lastDonationContainer = document.getElementById('lastDonationContainer');
  const inputLastDonationDate = document.getElementById('inputLastDonationDate');
  const feedbackDonationInterval = document.getElementById('feedbackDonationInterval');

  // Elementos da Etapa 4 (Condições)
  const healthConditionsList = document.getElementById('healthConditionsList');

  // Elementos da Etapa 5 (Hábitos)
  const habitSleepYes = document.getElementById('habitSleepYes');
  const habitSleepNo = document.getElementById('habitSleepNo');
  const habitAlcoholYes = document.getElementById('habitAlcoholYes');
  const habitAlcoholNo = document.getElementById('habitAlcoholNo');
  const habitMealYes = document.getElementById('habitMealYes');
  const habitMealNo = document.getElementById('habitMealNo');

  // Limita data máxima da doação para a data atual
  if (inputLastDonationDate) {
    const todayIso = new Date().toISOString().split('T')[0];
    inputLastDonationDate.setAttribute('max', todayIso);
  }

  // --- Validação & Feedback Etapa 1: Idade ---
  function validateAgeInput() {
    if (!inputAge || !feedbackAge) return;
    const val = parseInt(inputAge.value, 10);
    wizardState.age = isNaN(val) ? null : val;

    if (isNaN(val) || val <= 0) {
      feedbackAge.style.display = 'none';
      return;
    }

    feedbackAge.style.display = 'flex';

    if (val === 16 || val === 17) {
      feedbackAge.className = 'step-feedback feedback-warning';
      feedbackAge.innerHTML = `
        <span style="font-size:1.2rem;">⚠️</span>
        <div>
          <strong>Atenção para 16 e 17 anos:</strong>
          <span>Você pode doar! No entanto, será indispensável o <strong>termo de autorização formal assinado</strong> pelos pais ou responsável legal, acompanhado de documento original com foto.</span>
        </div>
      `;
    } else if (val < 16) {
      feedbackAge.className = 'step-feedback feedback-danger';
      feedbackAge.innerHTML = `
        <span style="font-size:1.2rem;">⛔</span>
        <div>
          <strong>Idade mínima não atingida:</strong>
          <span>A legislação brasileira permite a doação de sangue apenas a partir dos 16 anos completos.</span>
        </div>
      `;
    } else if (val > 69) {
      feedbackAge.className = 'step-feedback feedback-danger';
      feedbackAge.innerHTML = `
        <span style="font-size:1.2rem;">⛔</span>
        <div>
          <strong>Idade máxima excedida:</strong>
          <span>O limite superior para doação no Brasil é de 69 anos, 11 meses e 29 dias (sendo que a primeira doação deve ocorrer impreterivelmente até os 60 anos).</span>
        </div>
      `;
    } else if (val > 60) {
      feedbackAge.className = 'step-feedback feedback-warning';
      feedbackAge.innerHTML = `
        <span style="font-size:1.2rem;">⚠️</span>
        <div>
          <strong>Atenção (61 a 69 anos):</strong>
          <span>Você pode doar normalmente caso já tenha realizado pelo menos uma doação de sangue <strong>antes dos 60 anos</strong>. A primeira doação é permitida somente até os 60 anos completos.</span>
        </div>
      `;
    } else {
      feedbackAge.className = 'step-feedback feedback-success';
      feedbackAge.innerHTML = `
        <span style="font-size:1.2rem;">✓</span>
        <div>
          <strong>Faixa etária ideal:</strong>
          <span>Você possui entre 18 e 60 anos, atendendo perfeitamente ao requisito etário para doação voluntária!</span>
        </div>
      `;
    }
  }

  if (inputAge) {
    inputAge.addEventListener('input', validateAgeInput);
  }

  // --- Validação & Feedback Etapa 2: Peso ---
  function validateWeightInput() {
    if (!inputWeight || !feedbackWeight) return;
    const val = parseFloat(inputWeight.value);
    wizardState.weight = isNaN(val) ? null : val;

    if (isNaN(val) || val <= 0) {
      feedbackWeight.style.display = 'none';
      return;
    }

    feedbackWeight.style.display = 'flex';

    if (val < 50) {
      feedbackWeight.className = 'step-feedback feedback-danger';
      feedbackWeight.innerHTML = `
        <span style="font-size:1.2rem;">⛔</span>
        <div>
          <strong>Peso abaixo do limite mínimo (50 kg):</strong>
          <span>O peso mínimo de 50 kg é uma exigência técnica para proteger o doador de reações adversas e garantir o volume seguro de anticoagulante na bolsa coletora.</span>
        </div>
      `;
    } else {
      feedbackWeight.className = 'step-feedback feedback-success';
      feedbackWeight.innerHTML = `
        <span style="font-size:1.2rem;">✓</span>
        <div>
          <strong>Peso adequado:</strong>
          <span>Com ${val} kg, você atende com total segurança aos padrões hematológicos para a coleta padrão de 450 ml.</span>
        </div>
      `;
    }
  }

  if (inputWeight) {
    inputWeight.addEventListener('input', validateWeightInput);
  }

  // --- Etapa 3: Gênero Biológico e Intervalo de Doação ---
  function updateGenderSelection(gender) {
    wizardState.gender = gender;
    if (btnGenderM && btnGenderF) {
      btnGenderM.classList.toggle('active', gender === 'M');
      btnGenderF.classList.toggle('active', gender === 'F');
    }
    recalculateDonationInterval();
  }

  if (btnGenderM) btnGenderM.addEventListener('click', () => updateGenderSelection('M'));
  if (btnGenderF) btnGenderF.addEventListener('click', () => updateGenderSelection('F'));

  function updateFirstTimeSelection(isFirst) {
    wizardState.isFirstTime = isFirst;
    if (btnFirstTimeYes && btnFirstTimeNo && lastDonationContainer) {
      btnFirstTimeYes.classList.toggle('active', isFirst);
      btnFirstTimeNo.classList.toggle('active', !isFirst);
      lastDonationContainer.style.display = isFirst ? 'none' : 'block';
    }
    recalculateDonationInterval();
  }

  if (btnFirstTimeYes) btnFirstTimeYes.addEventListener('click', () => updateFirstTimeSelection(true));
  if (btnFirstTimeNo) btnFirstTimeNo.addEventListener('click', () => updateFirstTimeSelection(false));

  function recalculateDonationInterval() {
    if (!feedbackDonationInterval) return;

    if (wizardState.isFirstTime) {
      wizardState.donationIntervalData = {
        isBlocked: false,
        daysSince: 0,
        daysNeeded: wizardState.gender === 'M' ? 60 : 90,
        daysRemaining: 0,
        allowedDateFormatted: ''
      };
      feedbackDonationInterval.style.display = 'none';
      return;
    }

    const dateVal = inputLastDonationDate ? inputLastDonationDate.value : '';
    wizardState.lastDonationDate = dateVal;

    if (!dateVal) {
      feedbackDonationInterval.style.display = 'none';
      return;
    }

    const donationDate = new Date(dateVal + 'T12:00:00');
    const today = new Date();
    today.setHours(12, 0, 0, 0);

    const diffMs = today.getTime() - donationDate.getTime();
    const daysSince = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    const daysNeeded = wizardState.gender === 'M' ? 60 : 90;
    const daysRemaining = daysNeeded - daysSince;

    feedbackDonationInterval.style.display = 'flex';

    if (daysRemaining > 0) {
      // Bloqueado por intervalo
      const allowedDate = new Date(donationDate.getTime() + (daysNeeded * 24 * 60 * 60 * 1000));
      const formattedDate = allowedDate.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });

      wizardState.donationIntervalData = {
        isBlocked: true,
        daysSince: daysSince,
        daysNeeded: daysNeeded,
        daysRemaining: daysRemaining,
        allowedDateFormatted: formattedDate
      };

      feedbackDonationInterval.className = 'step-feedback feedback-warning';
      feedbackDonationInterval.innerHTML = `
        <span style="font-size:1.3rem;">⏱️</span>
        <div>
          <strong>Intervalo biológico em andamento:</strong>
          <span>Sua última doação foi há <strong>${daysSince} dias</strong>. Para o gênero biológico selecionado (${wizardState.gender === 'M' ? 'masculino: 60 dias' : 'feminino: 90 dias'}), ainda faltam <strong>${daysRemaining} dias</strong>.<br>
          Sua doação estará liberada exatamente em: <strong style="color:#B45309; text-decoration:underline;">${formattedDate}</strong>.</span>
        </div>
      `;
    } else {
      // Intervalo cumprido
      wizardState.donationIntervalData = {
        isBlocked: false,
        daysSince: daysSince,
        daysNeeded: daysNeeded,
        daysRemaining: 0,
        allowedDateFormatted: ''
      };

      feedbackDonationInterval.className = 'step-feedback feedback-success';
      feedbackDonationInterval.innerHTML = `
        <span style="font-size:1.3rem;">✓</span>
        <div>
          <strong>Intervalo cumprido com sucesso!</strong>
          <span>Sua última doação foi há <strong>${daysSince} dias</strong> (mínimo necessário: ${daysNeeded} dias). Seu organismo já recompôs os níveis de hemoglobina e você está plenamente liberado(a) para doar hoje!</span>
        </div>
      `;
    }
  }

  if (inputLastDonationDate) {
    inputLastDonationDate.addEventListener('change', recalculateDonationInterval);
  }

  // --- Etapa 4: Condições de Saúde (Chips Interativos) ---
  if (healthConditionsList) {
    const chips = healthConditionsList.querySelectorAll('.health-chip');
    chips.forEach(chip => {
      chip.addEventListener('click', () => {
        const condition = chip.getAttribute('data-condition');

        if (condition === 'none') {
          // Desmarca todas as outras
          chips.forEach(c => c.classList.remove('active'));
          chip.classList.add('active');
          wizardState.selectedConditions.clear();
          wizardState.selectedConditions.add('none');
        } else {
          // Desmarca a opção "none"
          const noneChip = healthConditionsList.querySelector('[data-condition="none"]');
          if (noneChip) noneChip.classList.remove('active');
          wizardState.selectedConditions.delete('none');

          chip.classList.toggle('active');
          if (chip.classList.contains('active')) {
            wizardState.selectedConditions.add(condition);
          } else {
            wizardState.selectedConditions.delete(condition);
          }

          // Se nenhuma ficou marcada, volta a marcar "none"
          if (wizardState.selectedConditions.size === 0) {
            if (noneChip) noneChip.classList.add('active');
            wizardState.selectedConditions.add('none');
          }
        }
      });
    });
  }

  // --- Etapa 5: Vacinação Recente & Viagens Endêmicas ---
  function setupSingleSelectChips(containerId, attrName, stateKey) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const chips = container.querySelectorAll('.health-chip');
    chips.forEach(chip => {
      chip.addEventListener('click', () => {
        chips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        wizardState[stateKey] = chip.getAttribute(attrName) || 'none';
      });
    });
  }

  setupSingleSelectChips('vaccineOptionsList', 'data-vaccine', 'vaccine');
  setupSingleSelectChips('travelOptionsList', 'data-travel', 'travel');

  // --- Etapa 6: Hábitos e Preparação para Hoje ---
  function setupHabitButtons(btnYes, btnNo, habitKey) {
    if (!btnYes || !btnNo) return;
    btnYes.addEventListener('click', () => {
      btnYes.classList.add('active');
      btnNo.classList.remove('active');
      wizardState.habits[habitKey] = true;
    });
    btnNo.addEventListener('click', () => {
      btnNo.classList.add('active');
      btnYes.classList.remove('active');
      wizardState.habits[habitKey] = false;
    });
  }

  setupHabitButtons(habitSleepYes, habitSleepNo, 'sleep');
  setupHabitButtons(habitAlcoholYes, habitAlcoholNo, 'alcohol');
  setupHabitButtons(habitMealYes, habitMealNo, 'meal');

  // --- Navegação entre Etapas do Wizard ---
  function updateWizardUI() {
    const step = wizardState.currentStep;
    const meta = stepMeta[step - 1];

    if (wizardStepText) wizardStepText.textContent = `Passo ${meta.number} de ${wizardState.totalSteps}`;
    if (wizardStepName) wizardStepName.textContent = meta.name;
    if (wizardPercentText) wizardPercentText.textContent = `${meta.percent}%`;
    if (wizardProgressBar) wizardProgressBar.style.width = `${meta.percent}%`;

    // Atualiza painéis visíveis
    for (let i = 1; i <= wizardState.totalSteps; i++) {
      const panel = document.getElementById(`stepPanel${i}`);
      if (panel) {
        panel.classList.toggle('active', i === step);
      }
    }

    // Botão Voltar visível a partir do passo 2
    if (btnWizardPrev) {
      btnWizardPrev.style.visibility = step > 1 ? 'visible' : 'hidden';
    }

    // Texto do botão Avançar
    if (btnWizardNext) {
      if (step === wizardState.totalSteps) {
        btnWizardNext.innerHTML = `<span>Finalizar e Emitir Cartão</span> &rarr;`;
      } else {
        btnWizardNext.innerHTML = `<span>Avançar</span> &rarr;`;
      }
    }
  }

  function validateCurrentStep() {
    const step = wizardState.currentStep;

    if (step === 1) {
      const age = wizardState.age;
      if (!age || age <= 0) {
        showToast('Por favor, informe sua idade para continuar.', 'error');
        if (inputAge) inputAge.focus();
        return false;
      }
    } else if (step === 2) {
      const weight = wizardState.weight;
      if (!weight || weight <= 0) {
        showToast('Por favor, informe seu peso corporal aproximado.', 'error');
        if (inputWeight) inputWeight.focus();
        return false;
      }
    } else if (step === 3) {
      if (!wizardState.isFirstTime && !wizardState.lastDonationDate) {
        showToast('Por favor, selecione a data aproximada da sua última doação.', 'error');
        if (inputLastDonationDate) inputLastDonationDate.focus();
        return false;
      }
    }

    return true;
  }

  if (btnWizardNext) {
    btnWizardNext.addEventListener('click', () => {
      if (!validateCurrentStep()) return;

      if (wizardState.currentStep < wizardState.totalSteps) {
        wizardState.currentStep++;
        updateWizardUI();
      } else {
        // Concluiu todos os passos: gera Cartão de Doador
        generateDonorCard();
      }
    });
  }

  if (btnWizardPrev) {
    btnWizardPrev.addEventListener('click', () => {
      if (wizardState.currentStep > 1) {
        wizardState.currentStep--;
        updateWizardUI();
      }
    });
  }

  // --- Geração do Cartão Personalizado de Doador ---
  function generateDonorCard() {
    if (!wizardContent || !wizardResult) return;

    // Avaliação detalhada de todas as regras médicas
    const disqualifications = [];
    let isUnderage = false;

    // 1. Idade e Regra de Primeira Doação até 60 anos
    if (wizardState.age < 16) {
      disqualifications.push('Idade inferior a 16 anos (idade mínima por lei).');
    } else if (wizardState.age === 16 || wizardState.age === 17) {
      isUnderage = true;
    } else if (wizardState.age > 69) {
      disqualifications.push('Idade superior a 69 anos (limite máximo de segurança).');
    } else if (wizardState.age > 60 && wizardState.isFirstTime) {
      disqualifications.push('Primeira doação após os 60 anos: conforme normas do Ministério da Saúde, a primeira doação deve ser realizada até os 60 anos completos.');
    }

    // 2. Peso
    if (wizardState.weight < 50) {
      disqualifications.push(`Peso atual (${wizardState.weight} kg) inferior ao mínimo de 50 kg exigido pelas normas técnicas.`);
    }

    // 3. Intervalo de Doação
    if (!wizardState.isFirstTime && wizardState.donationIntervalData.isBlocked) {
      disqualifications.push(`Intervalo entre doações não atingido: faltam ${wizardState.donationIntervalData.daysRemaining} dias para completar os ${wizardState.donationIntervalData.daysNeeded} dias regulamentares.`);
    }

    // 4. Condições de Saúde Selecionadas
    if (wizardState.selectedConditions.has('flu')) {
      disqualifications.push('Sintomas de gripe, resfriado, febre ou infecções nos últimos 7 a 14 dias (necessário aguardar o fim dos sintomas + período de carência).');
    }
    if (wizardState.selectedConditions.has('tattoo')) {
      disqualifications.push('Tatuagem, maquiagem definitiva ou piercing nos últimos 6 a 12 meses (inaptidão temporária por período de janela imunológica).');
    }
    if (wizardState.selectedConditions.has('meds')) {
      disqualifications.push('Uso de antibióticos ou medicamentos contínuos (antibióticos exigem 7 a 14 dias após a última dose; uso contínuo requer avaliação médica presencial).');
    }
    if (wizardState.selectedConditions.has('surgery')) {
      disqualifications.push('Cirurgia recente ou exame invasivo/endoscopia nos últimos 6 meses (necessário aguardar 6 a 12 meses conforme o porte).');
    }

    // 5. Vacinação Recente & Viagens para Áreas Endêmicas
    if (wizardState.vaccine === '48h') {
      disqualifications.push('Vacinação recente (Gripe/Influenza ou Coronavac): aguardar 48 horas após a aplicação.');
    } else if (wizardState.vaccine === '7d') {
      disqualifications.push('Vacinação recente contra COVID-19 (Pfizer, AstraZeneca ou Janssen): aguardar 7 dias após a dose.');
    } else if (wizardState.vaccine === '28d') {
      disqualifications.push('Vacina de vírus vivo atenuado (Febre Amarela, Tríplice Viral ou Dengue): aguardar 28 dias (4 semanas) após a aplicação.');
    }

    if (wizardState.travel === 'malaria') {
      disqualifications.push('Viagem recente para área endêmica de Malária (Região Amazônica): inaptidão temporária de 12 meses após o retorno.');
    } else if (wizardState.travel === 'yellowfever') {
      disqualifications.push('Viagem recente para área com surto de Febre Amarela ou Dengue grave: aguardar 30 dias após o retorno.');
    }

    // 5. Hábitos Imediatos de Hoje
    if (wizardState.habits.sleep === false) {
      disqualifications.push('Sono insuficiente: é necessário ter dormido ao menos 6 horas consecutivas na noite anterior para evitar hipotensão.');
    }
    if (wizardState.habits.alcohol === true) {
      disqualifications.push('Consumo de bebida alcoólica nas últimas 12 horas (inviabiliza a doação hoje).');
    }
    if (wizardState.habits.meal === false) {
      disqualifications.push('Alimentação inadequada ou ingestão de refeição gordurosa nas últimas 4 horas.');
    }

    // Status final
    let cardStatus = 'eligible'; // 'eligible', 'minor', 'deferred'
    if (disqualifications.length > 0) {
      cardStatus = 'deferred';
    } else if (isUnderage) {
      cardStatus = 'minor';
    }

    // Gera protocolo único
    const randomProtocol = 'FUSAM-' + new Date().getFullYear() + '-' + Math.random().toString(36).substring(2, 7).toUpperCase();

    // Renderiza HTML do Cartão Personalizado
    let statusClass = 'status-eligible';
    let statusBadgeText = '✓ Apto para Doar Imediatamente';
    let statusTitle = 'Parabéns! Você está pré-apto para doar hoje';
    let statusDesc = 'Você atende a todos os critérios e diretrizes clínicas preliminares. Seu comparecimento ao Hospital FUSAM de Caçapava é essencial para salvar vidas hoje!';

    if (cardStatus === 'minor') {
      statusClass = 'status-minor';
      statusBadgeText = '⚠️ Apto com Autorização dos Pais';
      statusTitle = 'Pré-apto com Autorização Formal dos Responsáveis';
      statusDesc = 'Você cumpre todos os requisitos de saúde! Por ter 16 ou 17 anos, você deve levar o formulário de autorização preenchido e assinado pelos pais ou responsável legal, junto a um documento oficial com foto.';
    } else if (cardStatus === 'deferred') {
      statusClass = 'status-deferred';
      statusBadgeText = '⏱️ Impedimento Temporário Identificado';
      statusTitle = 'Aguarde o término do período de carência';
      statusDesc = 'Identificamos um ou mais pontos temporários que demandam alguns dias ou meses de espera. Essa cautela visa exclusivamente preservar a sua saúde e a pureza do sangue coletado.';
    }

    // Caixa de Data Exata de Retorno (se o bloqueio for de intervalo de doação)
    let returnDateHtml = '';
    if (wizardState.donationIntervalData.isBlocked && wizardState.donationIntervalData.allowedDateFormatted) {
      returnDateHtml = `
        <div class="return-date-box">
          <div class="return-date-icon" aria-hidden="true">📅</div>
          <div class="return-date-info">
            <strong>Data Exata Calculada para sua Próxima Doação:</strong>
            <p>Seu intervalo regulamentar de descanso estará concluído em:</p>
            <span class="highlight-date">${wizardState.donationIntervalData.allowedDateFormatted}</span>
            <p style="margin-top:0.35rem; font-size:0.8rem;">(Faltam apenas ${wizardState.donationIntervalData.daysRemaining} dias a partir de hoje).</p>
          </div>
        </div>
      `;
    }

    // Lista de motivos se estiver impedido
    let deferralListHtml = '';
    if (disqualifications.length > 0) {
      const items = disqualifications.map(item => `<li>${item}</li>`).join('');
      deferralListHtml = `
        <div class="deferral-reasons-container">
          <div class="deferral-reasons-box">
            <h4 class="deferral-reasons-title">Motivo(s) da Inaptidão Temporária:</h4>
            <ul class="deferral-list">
              ${items}
            </ul>
          </div>
        </div>
      `;
    }

    wizardResult.innerHTML = `
      <div class="donor-card-badge">
        <!-- Topo do Cartão com Marca e Protocolo -->
        <div class="donor-card-top-header">
          <div class="donor-card-brand">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" fill="#D92525" stroke="#D92525"/>
            </svg>
            <div>
              <span class="donor-card-brand-title">FUSAM Sangue Bom</span>
              <span class="donor-card-brand-sub">Comprovante de Triagem Digital</span>
            </div>
          </div>
          <div class="donor-card-protocol">
            <span>Protocolo de Triagem:</span>
            <strong>${randomProtocol}</strong>
          </div>
        </div>

        <!-- Banner de Status do Doador -->
        <div class="donor-card-status-banner ${statusClass}">
          <span class="status-badge-pill">${statusBadgeText}</span>
          <h3 class="status-banner-title">${statusTitle}</h3>
          <p class="status-banner-desc">${statusDesc}</p>
        </div>

        <!-- Faixa com Atributos do Doador -->
        <div class="donor-attributes-strip">
          <div class="donor-attr-item">
            <span class="donor-attr-label">Idade</span>
            <span class="donor-attr-val">${wizardState.age} anos</span>
          </div>
          <div class="donor-attr-item">
            <span class="donor-attr-label">Peso</span>
            <span class="donor-attr-val">${wizardState.weight} kg</span>
          </div>
          <div class="donor-attr-item">
            <span class="donor-attr-label">Gênero</span>
            <span class="donor-attr-val">${wizardState.gender === 'M' ? 'Masculino' : 'Feminino'}</span>
          </div>
          <div class="donor-attr-item">
            <span class="donor-attr-label">Histórico</span>
            <span class="donor-attr-val">${wizardState.isFirstTime ? '1ª Doação' : 'Já Doador'}</span>
          </div>
        </div>

        <!-- Exibição de Data Calculada (quando aplicável) -->
        ${returnDateHtml}

        <!-- Lista de Motivos (se houver) -->
        ${deferralListHtml}

        <!-- Checklist de Documentos e Cuidados Obrigatórios -->
        <div class="donor-card-checklist">
          <h4 class="checklist-title">
            <span>📋</span> Documentos & Cuidados Essenciais para o Dia
          </h4>
          <p class="checklist-subtitle">Confira as orientações indispensáveis antes de se dirigir ao Hospital FUSAM:</p>

          <div class="checklist-items-grid">
            <div class="checklist-item-card">
              <span class="checklist-item-icon">🪪</span>
              <div class="checklist-item-text">
                <strong>Documento Oficial com Foto</strong>
                <p>Obrigatório apresentar RG, CNH, Passaporte ou Carteira de Trabalho física ou digital oficial.</p>
              </div>
            </div>

            <div class="checklist-item-card">
              <span class="checklist-item-icon">🥪</span>
              <div class="checklist-item-text">
                <strong>Estar Bem Alimentado</strong>
                <p>Nunca doe em jejum prolongado. Faça um lanche leve com sucos, pães e frutas antes da coleta.</p>
              </div>
            </div>

            <div class="checklist-item-card">
              <span class="checklist-item-icon">🥗</span>
              <div class="checklist-item-text">
                <strong>Evitar Gorduras (4 horas antes)</strong>
                <p>Não ingira frituras, ovos, queijos amarelos, maionese ou carnes gordurosas para não turvar o plasma.</p>
              </div>
            </div>

            <div class="checklist-item-card">
              <span class="checklist-item-icon">🚫</span>
              <div class="checklist-item-text">
                <strong>Sem Bebidas Alcoólicas (12 horas)</strong>
                <p>Abstenha-se de bebidas alcoólicas nas 12 horas que antecedem a doação para assegurar hidratação.</p>
              </div>
            </div>

            <div class="checklist-item-card">
              <span class="checklist-item-icon">😴</span>
              <div class="checklist-item-text">
                <strong>Descanso Reparador</strong>
                <p>Ter dormido no mínimo 6 horas consecutivas na noite anterior para prevenir mal-estar.</p>
              </div>
            </div>

            <div class="checklist-item-card">
              <span class="checklist-item-icon">🚭</span>
              <div class="checklist-item-text">
                <strong>Sem Cigarro (2 horas)</strong>
                <p>Evite fumar 2 horas antes e 2 horas após a doação para oxigenação adequada dos tecidos.</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Aviso Legal no Comprovante -->
        <div class="clinical-disclaimer-box" style="margin: 1rem 1.5rem 0;">
          <span class="disclaimer-icon" aria-hidden="true">⚖️</span>
          <p>
            <strong>Triagem Prévia Educativa (ANVISA / Ministério da Saúde):</strong> Este comprovante não substitui a entrevista clínica presencial obrigatória realizada no Banco de Sangue da FUSAM.
          </p>
        </div>

        <!-- Ações do Cartão -->
        <div class="donor-card-actions">
          <button type="button" class="btn btn-ghost btn-sm" id="btnRestartWizard">
            &larr; Refazer Simulação
          </button>
          <div style="display:flex; gap:0.6rem; flex-wrap:wrap;">
            <button type="button" class="btn btn-outline btn-sm" id="btnPrintDonorCard">
              🖨️ Imprimir / Salvar Orientações
            </button>
            <a href="#cadastro" class="btn btn-primary btn-sm" id="btnGoToRegisterFromCard">
              Confirmar Cadastro na FUSAM &rarr;
            </a>
          </div>
        </div>
      </div>
    `;

    // Alterna visualização do container
    wizardContent.style.display = 'none';
    wizardResult.style.display = 'block';

    // Rola suavemente até o cartão para leitura imediata
    const cardEl = document.getElementById('quizContainer');
    if (cardEl) {
      cardEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    // Configura botões de evento do Cartão
    const btnRestartWizard = document.getElementById('btnRestartWizard');
    if (btnRestartWizard) {
      btnRestartWizard.addEventListener('click', restartWizard);
    }

    const btnPrintDonorCard = document.getElementById('btnPrintDonorCard');
    if (btnPrintDonorCard) {
      btnPrintDonorCard.addEventListener('click', () => {
        window.print();
      });
    }

    const btnGoToRegisterFromCard = document.getElementById('btnGoToRegisterFromCard');
    if (btnGoToRegisterFromCard) {
      btnGoToRegisterFromCard.addEventListener('click', (e) => {
        e.preventDefault();
        const registerSec = document.getElementById('cadastro');
        if (registerSec) {
          registerSec.scrollIntoView({ behavior: 'smooth' });
          setTimeout(() => {
            const nameInput = document.getElementById('donorName');
            if (nameInput) nameInput.focus();
          }, 600);
        }
      });
    }
  }

  function restartWizard() {
    wizardState.currentStep = 1;
    wizardState.age = null;
    wizardState.weight = null;
    wizardState.isFirstTime = true;
    wizardState.lastDonationDate = '';
    wizardState.donationIntervalData = {
      isBlocked: false,
      daysSince: 0,
      daysNeeded: 60,
      daysRemaining: 0,
      allowedDateFormatted: ''
    };
    wizardState.selectedConditions.clear();
    wizardState.selectedConditions.add('none');
    wizardState.vaccine = 'none';
    wizardState.travel = 'none';

    if (inputAge) inputAge.value = '';
    if (feedbackAge) feedbackAge.style.display = 'none';
    if (inputWeight) inputWeight.value = '';
    if (feedbackWeight) feedbackWeight.style.display = 'none';
    if (inputLastDonationDate) inputLastDonationDate.value = '';
    if (feedbackDonationInterval) feedbackDonationInterval.style.display = 'none';

    updateGenderSelection('M');
    updateFirstTimeSelection(true);

    if (healthConditionsList) {
      const chips = healthConditionsList.querySelectorAll('.health-chip');
      chips.forEach(c => {
        c.classList.toggle('active', c.getAttribute('data-condition') === 'none');
      });
    }

    ['vaccineOptionsList', 'travelOptionsList'].forEach(listId => {
      const listEl = document.getElementById(listId);
      if (listEl) {
        const chips = listEl.querySelectorAll('.health-chip');
        chips.forEach(c => {
          const val = c.getAttribute('data-vaccine') || c.getAttribute('data-travel');
          c.classList.toggle('active', val === 'none');
        });
      }
    });

    if (wizardResult) wizardResult.style.display = 'none';
    if (wizardContent) wizardContent.style.display = 'block';

    updateWizardUI();
  }

  // Inicializa o Wizard no Passo 1
  updateWizardUI();



  /* ==========================================================================
     4. Cadastro de Doadores de Emergência & localStorage
     ========================================================================== */
  const donorForm = document.getElementById('emergencyDonorForm');
  const donorName = document.getElementById('donorName');
  const donorPhone = document.getElementById('donorPhone');
  const donorBloodType = document.getElementById('donorBloodType');
  const donorNeighborhood = document.getElementById('donorNeighborhood');
  const donorConsent = document.getElementById('donorConsent');

  const formSuccessCard = document.getElementById('formSuccessCard');
  const registeredName = document.getElementById('registeredName');
  const registeredPhone = document.getElementById('registeredPhone');
  const registeredBloodType = document.getElementById('registeredBloodType');
  const registeredNeighborhood = document.getElementById('registeredNeighborhood');
  const totalDonorsCount = document.getElementById('totalDonorsCount');
  const btnNewRegistration = document.getElementById('btnNewRegistration');
  const btnViewDonorsList = document.getElementById('btnViewDonorsList');

  const STORAGE_KEY_DONORS = 'fusam_donors_registered_v1';

  function getSavedDonors() {
    try {
      const data = localStorage.getItem(STORAGE_KEY_DONORS);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  function saveDonors(list) {
    try {
      localStorage.setItem(STORAGE_KEY_DONORS, JSON.stringify(list));
      updateDonorsCount();
    } catch (e) {
      console.warn('Falha ao salvar doadores.', e);
    }
  }

  function updateDonorsCount() {
    const list = getSavedDonors();
    if (totalDonorsCount) {
      totalDonorsCount.textContent = list.length;
    }
  }

  // Máscara dinâmica de telefone para WhatsApp: (12) 9XXXX-XXXX
  if (donorPhone) {
    donorPhone.addEventListener('input', (e) => {
      let value = e.target.value.replace(/\D/g, '');
      if (value.length > 11) value = value.slice(0, 11);

      if (value.length > 6) {
        value = `(${value.slice(0, 2)}) ${value.slice(2, 7)}-${value.slice(7)}`;
      } else if (value.length > 2) {
        value = `(${value.slice(0, 2)}) ${value.slice(2)}`;
      } else if (value.length > 0) {
        value = `(${value}`;
      }
      e.target.value = value;
    });
  }

  // Validação simples dos campos
  function validateForm() {
    let isValid = true;

    // Nome
    const nameVal = donorName ? donorName.value.trim() : '';
    const errorName = document.getElementById('errorDonorName');
    if (!nameVal || nameVal.length < 3) {
      donorName.classList.add('is-invalid');
      if (errorName) errorName.classList.add('visible');
      isValid = false;
    } else {
      donorName.classList.remove('is-invalid');
      if (errorName) errorName.classList.remove('visible');
    }

    // Telefone
    const phoneVal = donorPhone ? donorPhone.value.replace(/\D/g, '') : '';
    const errorPhone = document.getElementById('errorDonorPhone');
    if (!phoneVal || phoneVal.length < 10) {
      donorPhone.classList.add('is-invalid');
      if (errorPhone) errorPhone.classList.add('visible');
      isValid = false;
    } else {
      donorPhone.classList.remove('is-invalid');
      if (errorPhone) errorPhone.classList.remove('visible');
    }

    // Tipo Sanguíneo
    const bloodVal = donorBloodType ? donorBloodType.value : '';
    const errorBlood = document.getElementById('errorDonorBloodType');
    if (!bloodVal) {
      donorBloodType.classList.add('is-invalid');
      if (errorBlood) errorBlood.classList.add('visible');
      isValid = false;
    } else {
      donorBloodType.classList.remove('is-invalid');
      if (errorBlood) errorBlood.classList.remove('visible');
    }

    // Bairro
    const neighVal = donorNeighborhood ? donorNeighborhood.value : '';
    const errorNeigh = document.getElementById('errorDonorNeighborhood');
    if (!neighVal) {
      donorNeighborhood.classList.add('is-invalid');
      if (errorNeigh) errorNeigh.classList.add('visible');
      isValid = false;
    } else {
      donorNeighborhood.classList.remove('is-invalid');
      if (errorNeigh) errorNeigh.classList.remove('visible');
    }

    return isValid;
  }

  // Envio do Formulário
  if (donorForm) {
    donorForm.addEventListener('submit', (e) => {
      e.preventDefault();

      if (!validateForm()) {
        showToast('Por favor, verifique os campos destacados em vermelho.', 'error');
        return;
      }

      const newDonor = {
        id: 'DNR-' + Date.now().toString(36).toUpperCase(),
        name: donorName.value.trim(),
        phone: donorPhone.value.trim(),
        bloodType: donorBloodType.value,
        neighborhood: donorNeighborhood.value,
        consent: donorConsent ? donorConsent.checked : true,
        registeredAt: new Date().toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      };

      // Salva no LocalStorage
      const list = getSavedDonors();
      list.unshift(newDonor);
      saveDonors(list);

      // Preenche os dados no card de confirmação
      if (registeredName) registeredName.textContent = newDonor.name;
      if (registeredPhone) registeredPhone.textContent = newDonor.phone;
      if (registeredBloodType) registeredBloodType.textContent = newDonor.bloodType;
      if (registeredNeighborhood) registeredNeighborhood.textContent = newDonor.neighborhood;

      // Altera visual: esconde formulário e exibe o card de sucesso
      donorForm.style.display = 'none';
      if (formSuccessCard) formSuccessCard.style.display = 'block';

      showToast(`Obrigado, ${newDonor.name}! Cadastro de emergência concluído com sucesso.`, 'success');
    });
  }

  // Botão "Novo Cadastro"
  if (btnNewRegistration) {
    btnNewRegistration.addEventListener('click', () => {
      if (donorForm) {
        donorForm.reset();
        donorForm.style.display = 'flex';
      }
      if (formSuccessCard) {
        formSuccessCard.style.display = 'none';
      }
    });
  }

  /* ==========================================================================
     5. Modal de Doadores Cadastrados (Demonstração Local)
     ========================================================================== */
  const donorsListModal = document.getElementById('donorsListModal');
  const btnCloseDonorsModal = document.getElementById('btnCloseDonorsModal');
  const btnCloseDonorsListBottom = document.getElementById('btnCloseDonorsListBottom');
  const donorsTableBody = document.getElementById('donorsTableBody');
  const noDonorsMessage = document.getElementById('noDonorsMessage');
  const btnClearDonorsList = document.getElementById('btnClearDonorsList');

  function openDonorsModal() {
    renderDonorsTable();
    if (donorsListModal) donorsListModal.style.display = 'flex';
  }

  function closeDonorsModal() {
    if (donorsListModal) donorsListModal.style.display = 'none';
  }

  function renderDonorsTable() {
    const list = getSavedDonors();
    if (!donorsTableBody || !noDonorsMessage) return;

    donorsTableBody.innerHTML = '';

    if (list.length === 0) {
      noDonorsMessage.style.display = 'block';
      return;
    }

    noDonorsMessage.style.display = 'none';

    list.forEach(donor => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td><strong>${escapeHtml(donor.name)}</strong></td>
        <td>${escapeHtml(donor.phone)}</td>
        <td><span class="badge-blood" style="font-size:0.75rem;">${escapeHtml(donor.bloodType)}</span></td>
        <td>${escapeHtml(donor.neighborhood)}</td>
        <td style="color:var(--text-muted); font-size:0.75rem;">${donor.registeredAt}</td>
      `;
      donorsTableBody.appendChild(row);
    });
  }

  if (btnViewDonorsList) btnViewDonorsList.addEventListener('click', openDonorsModal);
  if (btnCloseDonorsModal) btnCloseDonorsModal.addEventListener('click', closeDonorsModal);
  if (btnCloseDonorsListBottom) btnCloseDonorsListBottom.addEventListener('click', closeDonorsModal);

  if (btnClearDonorsList) {
    btnClearDonorsList.addEventListener('click', () => {
      if (confirm('Deseja realmente limpar todos os registros locais salvos neste navegador?')) {
        saveDonors([]);
        renderDonorsTable();
        showToast('Registros locais apagados.', 'info');
      }
    });
  }

  window.addEventListener('click', (e) => {
    if (e.target === donorsListModal) {
      closeDonorsModal();
    }
  });

  // Atualiza contagem inicial de doadores
  updateDonorsCount();


  /* ==========================================================================
     6. Toast Notifications Utilitário
     ========================================================================== */
  function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type === 'success' ? 'toast-success' : ''}`;
    toast.innerHTML = `
      <span style="font-size: 1.15rem;">${type === 'success' ? '✓' : type === 'error' ? '⚠️' : 'ℹ️'}</span>
      <span>${escapeHtml(message)}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(() => {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 300);
    }, 4000);
  }

  // Prevenção de XSS ao renderizar dados do usuário
  function escapeHtml(string) {
    if (!string) return '';
    return String(string)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /* ==========================================================================
     7. Modal de Política de Privacidade & Termos de Uso (LGPD)
     ========================================================================== */
  const legalModal = document.getElementById('legalModal');
  const legalModalTitle = document.getElementById('legalModalTitle');
  const legalModalBody = document.getElementById('legalModalBody');
  const btnCloseLegalModal = document.getElementById('btnCloseLegalModal');
  const btnCloseLegalModalBottom = document.getElementById('btnCloseLegalModalBottom');

  const LEGAL_CONTENT = {
    privacy: {
      title: 'Política de Privacidade & LGPD (Lei nº 13.709/2018)',
      html: `
        <h4>1. Confidencialidade na Triagem Online</h4>
        <p>As respostas fornecidas no <strong>Simulador de Aptidão ("Posso Doar?")</strong> são processadas exclusivamente em tempo real no navegador do usuário para fins educativos e de orientação prévia. <strong>Nenhum dado clínico ou resposta do questionário é enviado ou armazenado em servidores externos.</strong></p>
        <h4>2. Cadastro de Doadores de Emergência</h4>
        <p>Os dados informados voluntariamente no formulário de contato (Nome, WhatsApp, Tipo Sanguíneo e Bairro) têm como única finalidade possibilitar o acionamento solidário em casos de estoque crítico no Hospital Municipal FUSAM de Caçapava/SP.</p>
        <h4>3. Segurança e Seus Direitos</h4>
        <ul>
          <li>Os registros locais podem ser consultados ou apagados integralmente a qualquer momento pelo próprio usuário através do botão "Limpar Registros Locais".</li>
          <li>Não compartilhamos, vendemos ou cedemos seus dados a terceiros ou para fins comerciais.</li>
          <li>Em caso de dúvidas, entre em contato com a Agência Transfusional da FUSAM pelo telefone (12) 3654-2100.</li>
        </ul>
      `
    },
    terms: {
      title: 'Termos de Uso e Aviso Legal',
      html: `
        <h4>1. Caráter Educativo e Orientativo</h4>
        <p>A plataforma <strong>FUSAM Sangue Bom</strong> é um canal de utilidade pública destinado a informar a população de Caçapava/SP sobre os níveis do banco de sangue e os requisitos básicos para doação, seguindo as diretrizes da <strong>ANVISA (RDC nº 34/2014)</strong> e do <strong>Ministério da Saúde</strong>.</p>
        <h4>2. Triagem Presencial Obrigatória</h4>
        <p>O resultado "Apto" ou "Impedimento Temporário" emitido pelo simulador digital <strong>não substitui a entrevista clínica presencial obrigatória</strong>, o exame físico e a triagem hematológica realizados pela equipe de saúde habilitada no banco de sangue da FUSAM.</p>
        <h4>3. Atualização do Painel de Estoque</h4>
        <p>Os níveis e quantidades de bolsas exibidos refletem as atualizações registradas pela equipe gestora e podem sofrer alterações ao longo do dia conforme a demanda hospitalar de urgências, cirurgias e UTIs.</p>
      `
    }
  };

  function openLegalModal(type) {
    const content = LEGAL_CONTENT[type] || LEGAL_CONTENT.privacy;
    if (legalModalTitle) legalModalTitle.textContent = content.title;
    if (legalModalBody) legalModalBody.innerHTML = content.html;
    if (legalModal) legalModal.style.display = 'flex';
  }

  function closeLegalModal() {
    if (legalModal) legalModal.style.display = 'none';
  }

  document.querySelectorAll('[data-open-policy]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const type = link.getAttribute('data-open-policy');
      openLegalModal(type);
    });
  });

  if (btnCloseLegalModal) btnCloseLegalModal.addEventListener('click', closeLegalModal);
  if (btnCloseLegalModalBottom) btnCloseLegalModalBottom.addEventListener('click', closeLegalModal);
  window.addEventListener('click', (e) => {
    if (e.target === legalModal) {
      closeLegalModal();
    }
  });

});

