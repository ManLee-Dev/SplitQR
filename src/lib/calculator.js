import { sum } from './format.js';

export const calculateSplit = ({ mode, total, people, items, fee }) => {
  if (!people.length) return [];

  if (mode === 'equal') {
    const base = Math.floor(total / people.length);
    return people.map((_, index) => base + (index === 0 ? total - base * people.length : 0));
  }

  const amounts = people.map(() => 0);

  const feeShare = Number(fee || 0) / people.length;
  people.forEach((_, index) => {
    amounts[index] += feeShare;
  });

  items.forEach((item) => {
    if (!item?.who?.length) return;

    const share = Number(item.price || 0) / item.who.length;
    item.who.forEach((personIndex) => {
      amounts[personIndex] += share;
    });
  });

  return amounts.map((value) => Math.round(value));
};

export const getDisplayTotal = (state) => {
  if (state.mode === 'equal') {
    return Number(state.total || 0);
  }

  return sum((state.items || []).map((item) => Number(item.price || 0))) + Number(state.fee || 0);
};

export const createEmptyItem = () => ({
  name: '',
  price: 0,
  who: [],
});
