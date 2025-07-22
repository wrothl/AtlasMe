// Beautiful color palette for scratch-off reveals
export const SCRATCH_COLORS = [
  // Vibrant Blues
  '#1E3A8A', '#3B82F6', '#60A5FA', '#93C5FD', '#DBEAFE',
  
  // Stunning Purples
  '#581C87', '#7C3AED', '#A855F7', '#C084FC', '#DDD6FE',
  
  // Rich Greens
  '#14532D', '#16A34A', '#22C55E', '#4ADE80', '#BBF7D0',
  
  // Warm Oranges
  '#C2410C', '#EA580C', '#F97316', '#FB923C', '#FED7AA',
  
  // Deep Reds
  '#991B1B', '#DC2626', '#EF4444', '#F87171', '#FECACA',
  
  // Golden Yellows
  '#A16207', '#D97706', '#F59E0B', '#FBBF24', '#FEF3C7',
  
  // Ocean Teals
  '#134E4A', '#0F766E', '#14B8A6', '#2DD4BF', '#99F6E4',
  
  // Sunset Pinks
  '#BE185D', '#E11D48', '#F43F5E', '#FB7185', '#FECDD3',
  
  // Royal Purples
  '#4C1D95', '#6D28D9', '#8B5CF6', '#A78BFA', '#C4B5FD',
  
  // Forest Greens
  '#365314', '#4D7C0F', '#65A30D', '#84CC16', '#BEF264',
  
  // Copper/Bronze
  '#92400E', '#B45309', '#D97706', '#F59E0B', '#FCD34D',
  
  // Midnight Blues
  '#1E1B4B', '#312E81', '#3730A3', '#4338CA', '#6366F1'
];

export const getRandomScratchColor = (): string => {
  return SCRATCH_COLORS[Math.floor(Math.random() * SCRATCH_COLORS.length)];
};

export const getGradientColor = (baseColor: string): string => {
  // Create a gradient effect by slightly modifying the base color
  const hex = baseColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  // Add some variation for gradient effect
  const newR = Math.min(255, Math.max(0, r + (Math.random() - 0.5) * 40));
  const newG = Math.min(255, Math.max(0, g + (Math.random() - 0.5) * 40));
  const newB = Math.min(255, Math.max(0, b + (Math.random() - 0.5) * 40));
  
  return `#${Math.round(newR).toString(16).padStart(2, '0')}${Math.round(newG).toString(16).padStart(2, '0')}${Math.round(newB).toString(16).padStart(2, '0')}`;
};