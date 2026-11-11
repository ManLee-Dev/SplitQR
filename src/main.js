import './styles.css';
import { BANKS } from './lib/banks.js';
import { calculateSplit, createEmptyItem, getDisplayTotal } from './lib/calculator.js';
import { formatCurrency, sanitizeText, toNumeric } from './lib/format.js';
import { buildQrSvg, buildQrText } from './lib/qr.js';

const state = {
  step: 1,
  mode: 'equal',
  total: 0,
  people: [],
  items: [],
  fee: 0,
  paid: {},
  owner: {
    bank: 'MB Bank',
    acc: '',
    name: '',
  },
};

const app = document.querySelector('#app');
const modalRoot = document.querySelector('#modal');

const loadOwnerFromStorage = () => {
  try {
    const saved = JSON.parse(localStorage.getItem('splitqr_owner') || 'null');
    if (saved) {
      state.owner = { ...state.owner, ...saved };
    }
  } catch (error) {
    console.warn('Unable to read saved owner', error);
  }
};

const persistOwner = () => {
  try {
    localStorage.setItem('splitqr_owner', JSON.stringify(state.owner));
  } catch (error) {
    console.warn('Unable to save owner', error);
  }
};

const toast = (message) => {
  const node = document.createElement('div');
  node.className = 'toast';
  node.textContent = message;
  document.body.appendChild(node);
  setTimeout(() => node.remove(), 1800);
};

const displaySummary = () => calculateSplit({
  mode: state.mode,
  total: Number(state.total || 0),
  people: state.people,
  items: state.items,
  fee: Number(state.fee || 0),
});

const renderStepIndicators = () =>
  '<div class="steps">' + [1, 2, 3].map((step) => `<i class="${state.step >= step ? 'on' : ''}"></i>`).join('') + '</div>';

const renderPeopleChips = () =>
  state.people.length
    ? state.people.map((person, index) => `<span class="chip" data-role="remove-person" data-index="${index}">${person} ✕</span>`).join('')
    : '<span class="sub">Chưa có thành viên nào</span>';

const renderItemList = () => {
  if (!state.people.length) {
    return '<p class="sub">Hãy thêm người trước khi tạo món.</p>';
  }

  return `
    ${state.items.map((item, index) => `
      <div class="item">
        <div class="row">
          <input data-role="item-name" data-index="${index}" value="${item.name || ''}" placeholder="Tên món" />
          <input class="fit" style="width: 110px;" data-role="item-price" data-index="${index}" inputmode="numeric" value="${item.price || ''}" placeholder="Giá" />
          <button class="ghost" data-role="remove-item" data-index="${index}">✕</button>
        </div>
        <div style="margin-top: 6px;">
          ${state.people.map((person, personIndex) => `
            <span class="chip ${item.who.includes(personIndex) ? '' : 'off'}" data-role="toggle-item-person" data-item-index="${index}" data-person-index="${personIndex}">${person}</span>
          `).join('')}
        </div>
      </div>
    `).join('')}
    <button class="secondary" style="width:100%; margin-top: 6px;" data-role="add-item">+ Thêm món</button>
  `;
};

const renderStepOne = () => `
  <h1>SplitQR</h1>
  <p class="sub">Chia tiền nhóm, mỗi người một mã VietQR.</p>
  ${renderStepIndicators()}
  <div class="card">
    <h2>1. Tài khoản nhận tiền</h2>
    <label>Ngân hàng</label>
    <select data-role="bank-select">
      ${Object.keys(BANKS).map((bank) => `<option value="${bank}" ${bank === state.owner.bank ? 'selected' : ''}>${bank}</option>`).join('')}
    </select>
    <label>Số tài khoản</label>
    <input data-role="account-input" inputmode="numeric" placeholder="VD: 0123456789" value="${state.owner.acc}" />
    <label>Tên chủ tài khoản</label>
    <input data-role="owner-name-input" placeholder="NGUYEN VAN A" value="${state.owner.name}" />
    <p class="sub" style="margin: 10px 0 0;">Thông tin được lưu trên máy bạn để lần sau dùng lại.</p>
  </div>
  <button class="secondary" style="width:100%;" data-role="demo-data">Dùng dữ liệu mẫu</button>
  <div class="bar"><div><button data-role="goto-step-two">Tiếp tục</button></div></div>
`;

const renderStepTwo = () => `
  ${renderStepIndicators()}
  <div class="card">
    <h2>2. Hóa đơn và thành viên</h2>
    <div class="tabs">
      <button class="${state.mode === 'equal' ? 'active' : ''}" data-role="mode-equal">Chia đều</button>
      <button class="${state.mode === 'item' ? 'active' : ''}" data-role="mode-item">Chia theo món</button>
    </div>
    <label>Người tham gia</label>
    <div>${renderPeopleChips()}</div>
    <div class="row" style="margin-top: 6px;">
      <input id="person-name" placeholder="Thêm tên (An, Bình...)" />
      <button class="fit secondary" data-role="add-person">Thêm</button>
    </div>
  </div>
  ${state.mode === 'equal'
    ? `<div class="card"><label style="margin-top: 0;">Tổng tiền (VNĐ)</label><input data-role="total-input" inputmode="numeric" placeholder="VD: 1200000" value="${state.total || ''}" /></div>`
    : `<div class="card"><h2>Danh sách món</h2>${renderItemList()}<label>Phí VAT / ship (chia đều)</label><input data-role="fee-input" inputmode="numeric" placeholder="0" value="${state.fee || ''}" /></div>`
  }
  <div class="card row">
    <span style="flex: none;">Tổng cộng</span>
    <b style="text-align: right;">${formatCurrency(getDisplayTotal(state))}</b>
  </div>
  <div class="bar"><div class="row"><button class="ghost fit" data-role="back-to-step-one">Quay lại</button><button data-role="create-qr">Tạo mã QR</button></div></div>
`;

const renderStepThree = () => {
  const amounts = displaySummary();
  const total = amounts.reduce((sumValue, amount) => sumValue + amount, 0);
  const paidCount = Object.values(state.paid).filter(Boolean).length;

  return `
    ${renderStepIndicators()}
    <div class="card">
      <div class="sub" style="margin: 0;">Tổng hóa đơn · ${state.people.length} người</div>
      <div class="big">${formatCurrency(total)}</div>
      <div class="sub" style="margin: 0;">Nhận về: ${state.owner.name || '—'} · ${state.owner.bank} · ${state.owner.acc}</div>
    </div>
    <h2>Bấm vào tên để hiện mã QR · đã trả ${paidCount}/${state.people.length}</h2>
    ${state.people.map((person, index) => `
      <button class="person ${state.paid[index] ? 'paid' : ''}" data-role="show-person" data-index="${index}">
        <span class="av">${person[0].toUpperCase()}</span>
        <span>${person}${state.paid[index] ? ' <span class="badge">✓ đã trả</span>' : ''}</span>
        <span class="amt">${formatCurrency(amounts[index])}</span>
      </button>
    `).join('')}
    <div class="row" style="margin-top: 12px;">
      <button class="secondary" data-role="copy-summary">Sao chép tóm tắt</button>
      <button class="secondary" data-role="download-summary">Tải ảnh summary</button>
    </div>
    <div class="bar"><div class="row"><button class="ghost fit" data-role="edit-bill">Sửa hóa đơn</button><button data-role="new-bill">Hóa đơn mới</button></div></div>
  `;
};

const render = () => {
  app.innerHTML = state.step === 1 ? renderStepOne() : state.step === 2 ? renderStepTwo() : renderStepThree();
};

const addPerson = () => {
  const input = document.querySelector('#person-name');
  const names = (input?.value || '').split(',').map((value) => sanitizeText(value)).filter(Boolean);

  if (!names.length) {
    toast('Nhập ít nhất một tên');
    return;
  }

  state.people.push(...names.filter((name) => !state.people.includes(name)));
  input.value = '';
  render();
};

const updateOwner = () => {
  const bank = document.querySelector('[data-role="bank-select"]')?.value || state.owner.bank;
  const account = document.querySelector('[data-role="account-input"]')?.value || state.owner.acc;
  const name = document.querySelector('[data-role="owner-name-input"]')?.value || state.owner.name;

  state.owner.bank = bank;
  state.owner.acc = sanitizeText(account).replace(/\D/g, '');
  state.owner.name = sanitizeText(name);

  if (!state.owner.acc || state.owner.acc.length < 6) {
    toast('Nhập số tài khoản hợp lệ');
    return false;
  }

  persistOwner();
  state.step = 2;
  render();
  return true;
};

const createDemoData = () => {
  state.owner = { bank: 'MB Bank', acc: '0123456789', name: 'NGUYEN VAN A' };
  state.mode = 'item';
  state.people = ['An', 'Bình', 'Cường', 'Dung'];
  state.items = [
    { name: 'Lẩu bò', price: 480000, who: [0, 1, 2, 3] },
    { name: 'Bia (6 lon)', price: 210000, who: [1, 2] },
    { name: 'Nước ngọt', price: 60000, who: [0, 3] },
    { name: 'Tráng miệng', price: 90000, who: [0, 3] },
  ];
  state.fee = 72000;
  state.paid = {};
  state.step = 3;
  render();
};

const createSummaryText = () => {
  const amounts = displaySummary();
  const total = amounts.reduce((sumValue, amount) => sumValue + amount, 0);
  return [
    '💸 CHIA TIỀN – tổng ' + formatCurrency(total),
    'Chuyển cho: ' + state.owner.name + ' · ' + state.owner.bank + ' · ' + state.owner.acc,
    '',
    ...state.people.map((person, index) => `${state.paid[index] ? '✅' : '⏳'} ${person}: ${formatCurrency(amounts[index])}`),
    '',
    'Nội dung CK: SplitQR <tên>',
  ].join('\n');
};

const copySummary = async () => {
  const text = createSummaryText();
  try {
    await navigator.clipboard.writeText(text);
    toast('Đã sao chép tóm tắt');
  } catch (error) {
    const temp = document.createElement('textarea');
    temp.value = text;
    document.body.appendChild(temp);
    temp.select();
    try {
      document.execCommand('copy');
      toast('Đã sao chép tóm tắt');
    } catch {
      toast('Không sao chép được');
    }
    temp.remove();
  }
};

const downloadSummary = () => {
  const amounts = displaySummary();
  const rows = Math.ceil(state.people.length / 2);
  const canvas = document.createElement('canvas');
  canvas.width = 720;
  canvas.height = 170 + rows * 330;
  const context = canvas.getContext('2d');

  context.fillStyle = '#f4f6f5';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = '#0f9d6b';
  context.fillRect(0, 0, canvas.width, 120);
  context.fillStyle = '#fff';
  context.font = 'bold 36px sans-serif';
  context.fillText('SplitQR · Chia tiền nhóm', 30, 52);
  context.font = '22px sans-serif';
  context.fillText(`${state.owner.name} · ${state.owner.bank} · ${state.owner.acc}`, 30, 90);

  state.people.forEach((person, index) => {
    const x = 30 + (index % 2) * 340;
    const y = 145 + Math.floor(index / 2) * 330;
    context.fillStyle = '#fff';
    context.beginPath();
    context.roundRect(x, y, 320, 310, 18);
    context.fill();

    context.fillStyle = '#14201a';
    context.font = 'bold 26px sans-serif';
    context.fillText(person, x + 16, y + 38);
    context.fillStyle = '#0f9d6b';
    context.font = 'bold 24px sans-serif';
    context.fillText(formatCurrency(amounts[index]), x + 16, y + 70);

    const qrSvg = buildQrSvg({
      amount: amounts[index],
      content: buildQrText(person),
      bankKey: state.owner.bank,
      account: state.owner.acc,
      ownerName: state.owner.name,
    });
    const wrapper = document.createElement('div');
    wrapper.innerHTML = qrSvg;
    const svg = wrapper.querySelector('svg');
    const serialized = new XMLSerializer().serializeToString(svg);
    const url = URL.createObjectURL(new Blob([serialized], { type: 'image/svg+xml;charset=utf-8' }));
    const image = new Image();
    image.onload = () => {
      context.drawImage(image, x + 50, y + 80, 220, 220);
      URL.revokeObjectURL(url);
    };
    image.src = url;
  });

  setTimeout(() => {
    canvas.toBlob((blob) => {
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'splitqr-summary.png';
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(link.href);
      toast('Đã tạo ảnh summary');
    });
  }, 100);
};

const showPersonCard = (index) => {
  const person = state.people[index];
  const amount = displaySummary()[index];
  const content = buildQrText(person);
  modalRoot.innerHTML = `
    <div class="modal" data-role="close-modal">
      <div class="sheet">
        <h2>${person} · ${formatCurrency(amount)}</h2>
        <div class="qrbox">${buildQrSvg({ amount, content, bankKey: state.owner.bank, account: state.owner.acc, ownerName: state.owner.name })}</div>
        <p class="sub">Mở app ngân hàng, quét mã. Số tiền, tài khoản và nội dung chuyển khoản sẽ được điền sẵn.</p>
        <div class="kv"><span>Người nhận</span><b>${state.owner.name}</b></div>
        <div class="kv"><span>Ngân hàng</span><b>${state.owner.bank}</b></div>
        <div class="kv"><span>Số TK</span><b>${state.owner.acc}</b></div>
        <div class="kv"><span>Nội dung</span><b>${content}</b></div>
        <div class="row" style="margin-top: 12px;">
          <button class="secondary" data-role="toggle-paid" data-index="${index}">${state.paid[index] ? 'Bỏ đánh dấu' : 'Đánh dấu đã trả'}</button>
          <button data-role="close-modal">Đóng</button>
        </div>
      </div>
    </div>
  `;
};

const handleClick = (event) => {
  const target = event.target.closest('[data-role]');
  if (!target) return;

  const { role } = target.dataset;

  if (role === 'goto-step-two') return updateOwner();
  if (role === 'back-to-step-one') return (() => { state.step = 1; render(); })();
  if (role === 'demo-data') return createDemoData();
  if (role === 'mode-equal') return (() => { state.mode = 'equal'; render(); })();
  if (role === 'mode-item') return (() => { state.mode = 'item'; state.items = state.items.length ? state.items : [createEmptyItem()]; render(); })();
  if (role === 'add-person') return addPerson();
  if (role === 'create-qr') {
    if (!state.people.length) return toast('Thêm ít nhất 1 người');
    if (!getDisplayTotal(state)) return toast('Nhập số tiền');
    state.step = 3;
    render();
    return;
  }
  if (role === 'copy-summary') return copySummary();
  if (role === 'download-summary') return downloadSummary();
  if (role === 'edit-bill') return (() => { state.step = 2; render(); })();
  if (role === 'new-bill') return (() => { state.step = 2; state.total = 0; state.people = []; state.items = []; state.fee = 0; state.paid = {}; render(); })();
  if (role === 'show-person') return showPersonCard(Number(target.dataset.index));
  if (role === 'toggle-paid') return (() => { const index = Number(target.dataset.index); state.paid[index] = !state.paid[index]; modalRoot.innerHTML = ''; render(); })();
  if (role === 'close-modal') return (() => { modalRoot.innerHTML = ''; })();
  if (role === 'add-item') return (() => { state.items.push(createEmptyItem()); render(); })();
  if (role === 'remove-item') return (() => { const index = Number(target.dataset.index); state.items.splice(index, 1); render(); })();
  if (role === 'remove-person') return (() => { const index = Number(target.dataset.index); state.people.splice(index, 1); state.items.forEach((item) => { item.who = item.who.filter((personIndex) => personIndex !== index).map((personIndex) => (personIndex > index ? personIndex - 1 : personIndex)); }); state.paid = {}; render(); })();
};

const handleInput = (event) => {
  const target = event.target;
  const role = target.dataset.role;

  if (role === 'bank-select') {
    state.owner.bank = target.value;
    persistOwner();
    return;
  }

  if (role === 'account-input') {
    state.owner.acc = sanitizeText(target.value).replace(/\D/g, '');
    persistOwner();
    return;
  }

  if (role === 'owner-name-input') {
    state.owner.name = sanitizeText(target.value);
    persistOwner();
    return;
  }

  if (role === 'total-input') {
    state.total = toNumeric(target.value);
    return;
  }

  if (role === 'fee-input') {
    state.fee = toNumeric(target.value);
    return;
  }

  if (role === 'item-name') {
    const index = Number(target.dataset.index);
    state.items[index].name = target.value;
    return;
  }

  if (role === 'item-price') {
    const index = Number(target.dataset.index);
    state.items[index].price = toNumeric(target.value);
  }
};

const handleToggle = (event) => {
  const target = event.target.closest('[data-role="toggle-item-person"]');
  if (!target) return;

  const itemIndex = Number(target.dataset.itemIndex);
  const personIndex = Number(target.dataset.personIndex);
  const item = state.items[itemIndex];
  item.who = item.who || [];

  const foundIndex = item.who.indexOf(personIndex);
  if (foundIndex === -1) {
    item.who.push(personIndex);
  } else {
    item.who.splice(foundIndex, 1);
  }

  render();
};

app.addEventListener('click', handleClick);
app.addEventListener('input', handleInput);
app.addEventListener('click', handleToggle);
app.addEventListener('keydown', (event) => {
  if (event.target.id === 'person-name' && event.key === 'Enter') addPerson();
});

modalRoot.addEventListener('click', (event) => {
  if (event.target.closest('[data-role="close-modal"]')) {
    modalRoot.innerHTML = '';
  }
});

loadOwnerFromStorage();
render();
