document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const cardsElements = document.querySelectorAll('.card');
    const usernameInput = document.getElementById('username');
    const joinBtn = document.getElementById('join-btn');
    const resetBtn = document.getElementById('reset-btn');
    const revealBtn = document.getElementById('reveal-btn');
    const votersList = document.getElementById('voters-list');
    const resultsSummary = document.getElementById('results-summary');
    
    // Application State
    let state = {
        users: {},
        currentUser: null,
        votesRevealed: false
    };
    
    // Event Listeners
    joinBtn.addEventListener('click', joinSession);
    resetBtn.addEventListener('click', resetVotes);
    revealBtn.addEventListener('click', revealVotes);
    
    cardsElements.forEach(card => {
        card.addEventListener('click', () => selectCard(card));
    });
    
    // Functions
    function joinSession() {
        const username = usernameInput.value.trim();
        if (username) {
            state.currentUser = username;
            if (!state.users[username]) {
                state.users[username] = null;
            }
            
            // Update UI
            joinBtn.textContent = 'Joined';
            joinBtn.disabled = true;
            usernameInput.disabled = true;
            updateVotersList();
            
            // Enable card selection
            cardsElements.forEach(card => {
                card.classList.add('selectable');
            });
        } else {
            alert('Please enter a username');
        }
    }
    
    function selectCard(card) {
        if (!state.currentUser) {
            alert('Please join the session first');
            return;
        }
        
        // Toggle selection
        cardsElements.forEach(c => {
            c.classList.remove('selected');
        });
        
        card.classList.add('selected');
        
        // Update state
        state.users[state.currentUser] = card.dataset.value;
        
        // Update UI
        updateVotersList();
    }
    
    function resetVotes() {
        // Reset state
        for (const user in state.users) {
            state.users[user] = null;
        }
        state.votesRevealed = false;
        
        // Reset UI
        cardsElements.forEach(card => {
            card.classList.remove('selected');
        });
        
        updateVotersList();
        resultsSummary.innerHTML = '';
    }
    
    function revealVotes() {
        state.votesRevealed = true;
        updateVotersList();
        showVotingSummary();
    }
    
    function updateVotersList() {
        votersList.innerHTML = '';
        
        for (const user in state.users) {
            const vote = state.users[user];
            const voterElement = document.createElement('div');
            voterElement.className = 'voter';
            
            const nameElement = document.createElement('span');
            nameElement.className = 'voter-name';
            nameElement.textContent = user;
            
            voterElement.appendChild(nameElement);
            
            if (vote) {
                const voteElement = document.createElement('div');
                voteElement.className = 'voter-card';
                
                if (!state.votesRevealed) {
                    voteElement.classList.add('hidden');
                    voteElement.textContent = '?';
                } else {
                    voteElement.textContent = vote;
                }
                
                voterElement.appendChild(voteElement);
            } else {
                const statusElement = document.createElement('span');
                statusElement.className = 'voter-status';
                statusElement.textContent = '(not voted)';
                voterElement.appendChild(statusElement);
            }
            
            votersList.appendChild(voterElement);
        }
    }
    
    function showVotingSummary() {
        if (!state.votesRevealed) return;
        
        // Count votes
        const votes = {};
        let totalVotes = 0;
        
        for (const user in state.users) {
            const vote = state.users[user];
            if (vote) {
                votes[vote] = (votes[vote] || 0) + 1;
                totalVotes++;
            }
        }
        
        if (totalVotes === 0) {
            resultsSummary.textContent = 'No votes yet.';
            return;
        }
        
        // Find the mode (most common vote)
        let maxVotes = 0;
        let modeVote = null;
        
        for (const vote in votes) {
            if (votes[vote] > maxVotes) {
                maxVotes = votes[vote];
                modeVote = vote;
            }
        }
        
        // Create summary
        const voteCounts = Object.entries(votes)
            .map(([vote, count]) => `${vote}: ${count} vote${count !== 1 ? 's' : ''}`)
            .join(', ');
        
        const consensusPercentage = Math.round((maxVotes / totalVotes) * 100);
        
        resultsSummary.innerHTML = `
            <p><strong>Vote Distribution:</strong> ${voteCounts}</p>
            <p><strong>Most common estimate:</strong> ${modeVote} (${maxVotes} vote${maxVotes !== 1 ? 's' : ''}, ${consensusPercentage}% consensus)</p>
        `;
    }
    
    // Initialize UI
    resetBtn.disabled = true;
    revealBtn.disabled = true;
    
    // Enable buttons when someone joins
    const checkButtonState = setInterval(() => {
        const hasUsers = Object.keys(state.users).length > 0;
        resetBtn.disabled = !hasUsers;
        
        // Only enable reveal when there are votes
        let hasVotes = false;
        for (const user in state.users) {
            if (state.users[user]) {
                hasVotes = true;
                break;
            }
        }
        revealBtn.disabled = !hasVotes;
    }, 500);
});

