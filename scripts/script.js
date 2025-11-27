const optionsDefault = [
  { label: '0.5x', weight: 3 },
  { label: '1x', weight: 2 },
  { label: '2x', weight: 3 },
  { label: '4x', weight: 1 }
];

const wheel = document.getElementById('wheel');
const spinBtn = document.getElementById('spin');
const selectedBox = document.getElementById('selected');
const optionsList = document.getElementById('optionsList');
const confettiRoot = document.getElementById('confetti');
const addBtn = document.getElementById('addOption');
const resetBtn = document.getElementById('resetBtn');

let options = JSON.parse(JSON.stringify(optionsDefault));
let spinning = false;
let currentRotation = 0;

function totalWeight() {
  return options.reduce((a, b) => a + b.weight, 0);
}

function buildWheel() {
  wheel.innerHTML = '';
  const total = totalWeight();

  // build gradient
  const colors = [
    '#8b5cf6','#06b6d4','#f97316','#ef4444',
    '#10b981','#f43f5e','#60a5fa','#f59e0b'
  ];

  let stops = [];
  let currentAngle = 0;

  options.forEach((opt, i) => {
    const angle = (opt.weight / total) * 360;
    const start = currentAngle;
    const end = currentAngle + angle;
    const color = colors[i % colors.length];
    stops.push(`${color} ${start}deg ${end}deg`);
    currentAngle += angle;
  });

  wheel.style.background = `conic-gradient(${stops.join(',')})`;

  // labels
  currentAngle = 0;
  options.forEach((opt, i) => {
    const angle = (opt.weight / total) * 360;
    const middleAngle = currentAngle + angle / 2;

    const seg = document.createElement('div');
    seg.style.position = 'absolute';
    seg.style.left = '50%';
    seg.style.top = '50%';
    seg.style.transform = `rotate(${middleAngle}deg)`;
    seg.style.transformOrigin = 'center center';

    const label = document.createElement('div');
    label.textContent = opt.label;
    label.style.position = 'absolute';

    let corrected = ((middleAngle % 360) + 360) % 360;
    if (corrected > 180) corrected -= 360;

    // Se estiver de cabeça para baixo (> 90 ou < -90) gira 180°
    if (corrected > 90 || corrected < -90) {
        corrected += 180;
    }

    label.style.transform = `translate(-50%, -150px) rotate(${0}deg)`;
    label.style.left = '50%';
    label.style.top = '0';
    label.style.fontSize = '14px';
    label.style.fontWeight = '600';
    label.style.color = 'white';
    label.style.textShadow = '0 1px 2px rgba(0,0,0,0.7)';
    label.style.whiteSpace = 'nowrap';

    seg.appendChild(label);
    wheel.appendChild(seg);

    currentAngle += angle;
  });

  renderOptionsList();
}

function renderOptionsList() {
  optionsList.innerHTML = '';
  options.forEach((opt, idx) => {
    const chip = document.createElement('div');
    chip.className = 'chip';
    chip.draggable = true;
    chip.textContent = `${opt.label} (peso: ${opt.weight})`;
    chip.dataset.index = idx;

    chip.title = 'Clique duas vezes para editar o texto\nClique com o botão direito para editar o peso';

    // editar texto
    chip.addEventListener('dblclick', () => {
      const newVal = prompt('Editar opção:', opt.label);
      if (newVal && newVal.trim()) {
        options[idx].label = newVal.trim();
        buildWheel();
      }
    });

    // editar PESO
    chip.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      const w = prompt('Peso (proporção):', opt.weight);
      const n = Number(w);
      if (!isNaN(n) && n > 0) {
        options[idx].weight = n;
        buildWheel();
      }
    });

    // drag and drop
    chip.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/plain', idx);
      chip.style.opacity = .5;
    });
    chip.addEventListener('dragend', () => chip.style.opacity = 1);
    chip.addEventListener('dragover', (e) => e.preventDefault());
    chip.addEventListener('drop', (e) => {
      e.preventDefault();
      const from = Number(e.dataTransfer.getData('text/plain'));
      const to = Number(chip.dataset.index);
      if (from !== to) {
        const item = options.splice(from, 1)[0];
        options.splice(to, 0, item);
        buildWheel();
      }
    });

    optionsList.appendChild(chip);
  });
}

function spin() {
  if (spinning) return;
  if (options.length === 0) return alert('Adicione pelo menos uma opção.');

  spinning = true;

  const total = totalWeight();

  const extraSpins = Math.floor(Math.random() * 5) + 6;
  const randomOffset = Math.random() * 360;
  const target = extraSpins * 360 + randomOffset;

  currentRotation = (currentRotation + target) % 36000;

  wheel.style.transition = 'transform 6s cubic-bezier(.08,.82,.17,1)';
  wheel.style.transform = `rotate(${currentRotation}deg)`;

  wheel.addEventListener('transitionend', onStop, { once: true });

  function angleDiff(a, b) {
    const d = Math.abs((a - b + 360) % 360);
    return Math.min(d, 360 - d);
  }

  function onStop() {
  // ângulo final da roleta (0..360)
  const final = ((currentRotation % 360) + 360) % 360;

  // converte para o ângulo na roleta original que ficou sob o ponteiro (topo)
  const pointerAngleInWheel = (360 - final) % 360;

  // soma cumulativa das fatias (em graus)
  const total = totalWeight(); // função existente que soma os pesos
  let cum = 0;
  let foundIndex = -1;

  for (let i = 0; i < options.length; i++) {
    const sliceAngle = (options[i].weight / total) * 360;
    const start = cum;
    const end = cum + sliceAngle;

    // se pointerAngleInWheel estiver entre start (inclusive) e end (exclusivo), é esse o setor
    if (pointerAngleInWheel >= start && pointerAngleInWheel < end) {
      foundIndex = i;
      break;
    }
    cum += sliceAngle;
  }

  // fallback (por segurança)
  if (foundIndex === -1) foundIndex = options.length - 1;

  const selected = options[foundIndex].label;
  showSelected(selected);
  celebrate();
  spinning = false;
  }
}

function showSelected(text) {
  selectedBox.textContent = text;
}

function celebrate() {
  confettiRoot.innerHTML = '';
  const pieces = 28;
  for (let i = 0; i < pieces; i++) {
    const el = document.createElement('span');
    const w = 8 + Math.random() * 8;
    el.style.width = w + 'px';
    el.style.height = (10 + Math.random() * 14) + 'px';
    el.style.left = (50 + (Math.random() - 0.5) * 60) + '%';
    el.style.top = (50 + (Math.random() - 0.5) * 60) + '%';
    el.style.background = ['#8b5cf6','#06b6d4','#f97316','#10b981','#ef4444'][Math.floor(Math.random() * 5)];
    el.style.transform = `translate(-50%,-50%) rotate(${Math.random()*360}deg)`;
    el.style.opacity = '1';
    el.style.transition = `transform ${1.8 + Math.random()}s cubic-bezier(.2,.8,.2,1), opacity 1.8s`;
    confettiRoot.appendChild(el);

    requestAnimationFrame(() => {
      const x = (Math.random() - 0.5) * 800;
      const y = 400 + Math.random() * 200;
      el.style.transform = `translate(${x}px, ${y}px) rotate(${Math.random()*720}deg)`;
      el.style.opacity = '0';
    });
  }

  setTimeout(() => confettiRoot.innerHTML = '', 2500);
}

spinBtn.addEventListener('click', spin);

addBtn.addEventListener('click', () => {
  const v = prompt('Nova opção:');
  if (v && v.trim()) {
    options.push({ label: v.trim(), weight: 1 });
    buildWheel();
  }
});

resetBtn.addEventListener('click', () => {
  if (confirm('Redefinir opções?')) {
    options = JSON.parse(JSON.stringify(optionsDefault));
    buildWheel();
    selectedBox.textContent = 'Opção selecionada';
  }
});

buildWheel();

document.addEventListener('keydown', (e) => {
  if (e.code === 'Space') {
    e.preventDefault();
    spin();
  }
});
