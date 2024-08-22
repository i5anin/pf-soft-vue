// src/utils/colorUtils.js

const COLORS = {
  red: '#dc3545',
  yellow: '#ffc107',
  green: '#28a745',
};

export function getHexColor(colorName) {
  return COLORS[colorName] || null;
}

export function getColorForGroup(index) {
  const hue = index * 137.508;
  return `hsl(${hue % 360}, 50%, 50%)`;
}
