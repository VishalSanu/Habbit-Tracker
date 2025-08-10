// Mock data service for habit tracker
let mockHabits = [
  {
    id: '1',
    name: 'Drink 8 glasses of water',
    category: 'Health & Fitness',
    createdAt: new Date('2024-01-01')
  },
  {
    id: '2',
    name: 'Read for 30 minutes',
    category: 'Learning',
    createdAt: new Date('2024-01-01')
  },
  {
    id: '3',
    name: 'Exercise for 30 minutes',
    category: 'Health & Fitness',
    createdAt: new Date('2024-01-02')
  },
  {
    id: '4',
    name: 'Meditate for 10 minutes',
    category: 'Mindfulness',
    createdAt: new Date('2024-01-03')
  }
];

// Mock completions data structure: { habitId: { 'YYYY-MM-DD': true } }
let mockCompletions = {
  '1': {
    '2024-01-15': true,
    '2024-01-16': true,
    '2024-01-17': true,
    '2024-01-18': true,
    '2024-01-19': true,
    '2024-01-20': true,
    '2024-01-21': true,
    '2024-01-22': false,
    '2024-01-23': true,
    '2024-01-24': true,
    '2024-01-25': true,
    '2024-01-26': true,
    '2024-01-27': true,
    '2024-01-28': true,
    '2024-01-29': true,
    '2024-01-30': true,
    [new Date().toISOString().split('T')[0]]: false // Today is not completed yet
  },
  '2': {
    '2024-01-15': true,
    '2024-01-16': false,
    '2024-01-17': true,
    '2024-01-18': true,
    '2024-01-19': false,
    '2024-01-20': true,
    '2024-01-21': true,
    '2024-01-22': true,
    '2024-01-23': true,
    '2024-01-24': false,
    '2024-01-25': true,
    '2024-01-26': true,
    '2024-01-27': false,
    '2024-01-28': true,
    '2024-01-29': true,
    '2024-01-30': true,
    [new Date().toISOString().split('T')[0]]: false
  },
  '3': {
    '2024-01-16': true,
    '2024-01-17': false,
    '2024-01-18': true,
    '2024-01-19': true,
    '2024-01-20': false,
    '2024-01-21': true,
    '2024-01-22': true,
    '2024-01-23': false,
    '2024-01-24': true,
    '2024-01-25': true,
    '2024-01-26': false,
    '2024-01-27': true,
    '2024-01-28': true,
    '2024-01-29': false,
    '2024-01-30': true,
    [new Date().toISOString().split('T')[0]]: false
  },
  '4': {
    '2024-01-17': true,
    '2024-01-18': true,
    '2024-01-19': true,
    '2024-01-20': true,
    '2024-01-21': true,
    '2024-01-22': true,
    '2024-01-23': true,
    '2024-01-24': true,
    '2024-01-25': true,
    '2024-01-26': true,
    '2024-01-27': true,
    '2024-01-28': true,
    '2024-01-29': true,
    '2024-01-30': true,
    [new Date().toISOString().split('T')[0]]: false
  }
};

export const getMockHabits = () => {
  return [...mockHabits];
};

export const getMockCompletions = () => {
  return { ...mockCompletions };
};

export const addMockHabit = (name, category) => {
  const newHabit = {
    id: Date.now().toString(),
    name,
    category,
    createdAt: new Date()
  };
  
  mockHabits.push(newHabit);
  mockCompletions[newHabit.id] = {};
  
  return newHabit;
};

export const deleteMockHabit = (habitId) => {
  mockHabits = mockHabits.filter(h => h.id !== habitId);
  delete mockCompletions[habitId];
};

export const toggleMockCompletion = (habitId, dateString) => {
  if (!mockCompletions[habitId]) {
    mockCompletions[habitId] = {};
  }
  
  mockCompletions[habitId][dateString] = !mockCompletions[habitId][dateString];
  
  return { ...mockCompletions };
};

export const getHabitStats = (habitId, days = 30) => {
  const today = new Date();
  let completed = 0;
  let currentStreak = 0;
  
  // Calculate completion rate
  for (let i = 0; i < days; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    if (mockCompletions[habitId]?.[dateStr]) {
      completed++;
    }
  }
  
  // Calculate current streak
  for (let i = 0; i < 365; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    if (mockCompletions[habitId]?.[dateStr]) {
      currentStreak++;
    } else if (i > 0) {
      break;
    }
  }
  
  return {
    completionRate: Math.round((completed / days) * 100),
    currentStreak
  };
};