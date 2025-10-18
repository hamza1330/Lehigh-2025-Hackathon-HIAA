const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Sample data
let users = [
    { id: 1, name: 'John Doe', points: 1250, level: 5 },
    { id: 2, name: 'Jane Smith', points: 980, level: 4 },
    { id: 3, name: 'Mike Johnson', points: 750, level: 3 }
];

let goals = [
    { id: 1, title: 'Complete Work Project', type: 'work', progress: 75, status: 'active', userId: 1 },
    { id: 2, title: 'Study 2 Hours Daily', type: 'study', progress: 100, status: 'completed', userId: 2 },
    { id: 3, title: 'Exercise 30 Minutes', type: 'fitness', progress: 40, status: 'active', userId: 1 }
];

let groups = [
    { id: 1, name: 'Study Squad', members: 6, totalPoints: 4200 },
    { id: 2, name: 'Fitness Warriors', members: 5, totalPoints: 3800 },
    { id: 3, name: 'Work Productivity', members: 4, totalPoints: 3200 }
];

// API Routes
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'GoalQuest API is running' });
});

app.get('/api/users', (req, res) => {
    res.json(users);
});

app.get('/api/goals', (req, res) => {
    res.json(goals);
});

app.get('/api/groups', (req, res) => {
    res.json(groups);
});

app.post('/api/goals', (req, res) => {
    const newGoal = {
        id: goals.length + 1,
        ...req.body,
        progress: 0,
        status: 'active'
    };
    goals.push(newGoal);
    res.json(newGoal);
});

app.post('/api/goals/:id/complete', (req, res) => {
    const goalId = parseInt(req.params.id);
    const goal = goals.find(g => g.id === goalId);
    
    if (goal) {
        goal.progress = 100;
        goal.status = 'completed';
        
        // Award points
        const user = users.find(u => u.id === goal.userId);
        if (user) {
            user.points += 50;
        }
        
        res.json({ message: 'Goal completed! +50 points', goal });
    } else {
        res.status(404).json({ error: 'Goal not found' });
    }
});

app.get('/api/leaderboard', (req, res) => {
    const leaderboard = users
        .sort((a, b) => b.points - a.points)
        .map((user, index) => ({
            rank: index + 1,
            ...user
        }));
    res.json(leaderboard);
});

// Serve the main app
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`🎯 GoalQuest server running on port ${PORT}`);
    console.log(`📱 Mobile app: http://localhost:${PORT}`);
    console.log(`🔗 API health: http://localhost:${PORT}/api/health`);
});
