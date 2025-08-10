import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

import { 
  Plus, 
  Trash2, 
  Moon, 
  Sun, 
  Calendar as CalendarIcon,
  Target,
  TrendingUp,
  CheckCircle,
  Circle
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useToast } from '../hooks/use-toast';
import { getMockHabits, getMockCompletions, addMockHabit, toggleMockCompletion, deleteMockHabit } from '../services/mockData';



const HabitTracker = () => {
  const [habits, setHabits] = useState([]);
  const [completions, setCompletions] = useState({});
  const [darkMode, setDarkMode] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isAddHabitOpen, setIsAddHabitOpen] = useState(false);
  const [newHabitName, setNewHabitName] = useState('');
  const [newHabitCategory, setNewHabitCategory] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const { toast } = useToast();

  const predefinedCategories = [
    'Health & Fitness',
    'Productivity',
    'Learning',
    'Mindfulness',
    'Social',
    'Hobbies',
    'Custom'
  ];

  useEffect(() => {
    // Load mock data
    setHabits(getMockHabits());
    setCompletions(getMockCompletions());
    
    // Check for saved dark mode preference
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    setDarkMode(savedDarkMode);
    
    if (savedDarkMode) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('darkMode', newDarkMode.toString());
    
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const addHabit = () => {
    if (!newHabitName.trim()) return;
    
    const category = newHabitCategory === 'Custom' ? customCategory : newHabitCategory;
    const newHabit = addMockHabit(newHabitName.trim(), category);
    
    setHabits(prev => [...prev, newHabit]);
    setNewHabitName('');
    setNewHabitCategory('');
    setCustomCategory('');
    setIsAddHabitOpen(false);
    
    toast({
      title: "Habit Added!",
      description: `"${newHabit.name}" has been added to your habits.`,
    });
  };

  const deleteHabit = (habitId) => {
    deleteMockHabit(habitId);
    setHabits(prev => prev.filter(h => h.id !== habitId));
    
    toast({
      title: "Habit Deleted",
      description: "The habit has been removed from your tracker.",
    });
  };

  const toggleHabitCompletion = (habitId, date) => {
    const dateStr = date.toISOString().split('T')[0];
    const newCompletions = toggleMockCompletion(habitId, dateStr);
    setCompletions(newCompletions);
  };

  const getCompletionRate = (habitId, days = 30) => {
    const today = new Date();
    let completed = 0;
    
    for (let i = 0; i < days; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      if (completions[habitId]?.[dateStr]) {
        completed++;
      }
    }
    
    return Math.round((completed / days) * 100);
  };

  const getCurrentStreak = (habitId) => {
    const today = new Date();
    let streak = 0;
    
    for (let i = 0; i < 365; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      if (completions[habitId]?.[dateStr]) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }
    
    return streak;
  };

  const isHabitCompletedOnDate = (habitId, date) => {
    const dateStr = date.toISOString().split('T')[0];
    return !!completions[habitId]?.[dateStr];
  };

  const getTodayStats = () => {
    const today = new Date().toISOString().split('T')[0];
    const totalHabits = habits.length;
    const completedToday = habits.filter(habit => 
      completions[habit.id]?.[today]
    ).length;
    
    return {
      totalHabits,
      completedToday,
      completionRate: totalHabits > 0 ? Math.round((completedToday / totalHabits) * 100) : 0
    };
  };

  const stats = getTodayStats();

  return (
    <div className={`min-h-screen transition-colors duration-200 ${darkMode ? 'dark' : ''}`}>
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Habit Tracker</h1>
            <p className="text-muted-foreground">Build better habits, one day at a time</p>
          </div>
          
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={toggleDarkMode}
              className="hover:bg-accent transition-colors"
            >
              {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
            
            <Dialog open={isAddHabitOpen} onOpenChange={setIsAddHabitOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Habit
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Habit</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="habit-name">Habit Name</Label>
                    <Input
                      id="habit-name"
                      placeholder="e.g., Drink 8 glasses of water"
                      value={newHabitName}
                      onChange={(e) => setNewHabitName(e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="habit-category">Category</Label>
                    <Select value={newHabitCategory} onValueChange={setNewHabitCategory}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {predefinedCategories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {newHabitCategory === 'Custom' && (
                    <div>
                      <Label htmlFor="custom-category">Custom Category</Label>
                      <Input
                        id="custom-category"
                        placeholder="Enter custom category"
                        value={customCategory}
                        onChange={(e) => setCustomCategory(e.target.value)}
                      />
                    </div>
                  )}
                  
                  <Button onClick={addHabit} className="w-full">
                    Add Habit
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
            <CardContent className="flex items-center p-6">
              <Target className="h-8 w-8 text-blue-600 dark:text-blue-400 mr-3" />
              <div>
                <p className="text-sm text-blue-700 dark:text-blue-300">Total Habits</p>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{stats.totalHabits}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800">
            <CardContent className="flex items-center p-6">
              <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400 mr-3" />
              <div>
                <p className="text-sm text-green-700 dark:text-green-300">Completed Today</p>
                <p className="text-2xl font-bold text-green-900 dark:text-green-100">{stats.completedToday}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200 dark:border-purple-800">
            <CardContent className="flex items-center p-6">
              <TrendingUp className="h-8 w-8 text-purple-600 dark:text-purple-400 mr-3" />
              <div>
                <p className="text-sm text-purple-700 dark:text-purple-300">Today's Rate</p>
                <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">{stats.completionRate}%</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="habits" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="habits">Habits</TabsTrigger>
            <TabsTrigger value="calendar">Calendar</TabsTrigger>
          </TabsList>
          
          <TabsContent value="habits" className="space-y-4">
            {habits.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <Target className="h-16 w-16 text-muted-foreground mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No habits yet</h3>
                  <p className="text-muted-foreground text-center mb-4">
                    Start building better habits by adding your first one!
                  </p>
                  <Button onClick={() => setIsAddHabitOpen(true)} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add Your First Habit
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {habits.map((habit) => {
                  const currentStreak = getCurrentStreak(habit.id);
                  const completionRate = getCompletionRate(habit.id);
                  const isCompletedToday = isHabitCompletedOnDate(habit.id, new Date());
                  
                  return (
                    <Card key={habit.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="p-0 h-8 w-8"
                              onClick={() => toggleHabitCompletion(habit.id, new Date())}
                            >
                              {isCompletedToday ? (
                                <CheckCircle className="h-6 w-6 text-green-500" />
                              ) : (
                                <Circle className="h-6 w-6 text-muted-foreground hover:text-foreground" />
                              )}
                            </Button>
                            <div>
                              <h3 className="font-semibold">{habit.name}</h3>
                              <Badge variant="secondary" className="text-xs">
                                {habit.category}
                              </Badge>
                            </div>
                          </div>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteHabit(habit.id)}
                            className="text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-muted-foreground mb-1">Current Streak</p>
                            <p className="text-xl font-bold">{currentStreak} days</p>
                          </div>
                          
                          <div>
                            <p className="text-sm text-muted-foreground mb-1">30-Day Rate</p>
                            <div className="flex items-center gap-2">
                              <Progress value={completionRate} className="flex-1" />
                              <span className="text-sm font-medium">{completionRate}%</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="calendar" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5" />
                  Completion Calendar
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {habits.map((habit) => (
                    <div key={habit.id} className="space-y-3">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{habit.name}</h4>
                        <Badge variant="outline" className="text-xs">
                          {habit.category}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-7 gap-2">
                        {Array.from({ length: 21 }, (_, i) => {
                          const date = new Date();
                          date.setDate(date.getDate() - (20 - i));
                          const dateStr = date.toISOString().split('T')[0];
                          const isCompleted = completions[habit.id]?.[dateStr];
                          const isToday = dateStr === new Date().toISOString().split('T')[0];
                          
                          return (
                            <div
                              key={i}
                              className={`
                                w-8 h-8 rounded-lg flex items-center justify-center text-xs cursor-pointer
                                transition-colors duration-200
                                ${isCompleted 
                                  ? 'bg-green-500 text-white hover:bg-green-600' 
                                  : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
                                }
                                ${isToday ? 'ring-2 ring-blue-500' : ''}
                              `}
                              onClick={() => toggleHabitCompletion(habit.id, date)}
                              title={date.toLocaleDateString()}
                            >
                              {date.getDate()}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                  
                  {habits.length === 0 && (
                    <div className="text-center py-8">
                      <CalendarIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">
                        Add some habits to see your completion calendar
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default HabitTracker;