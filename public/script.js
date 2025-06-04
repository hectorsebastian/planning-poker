document.addEventListener('DOMContentLoaded', function() {
    // Initialize Socket.IO connection
    const socket = io();
    
    // DOM Elements
    const cardsElements = document.querySelectorAll('.card');
    const usernameInput = document.getElementById('username');
    const roomIdInput = document.getElementById('room-id');
    const joinBtn = document.getElementById('join-btn');
    const resetBtn = document.getElementById('reset-btn');
    const revealBtn = document.getElementById('reveal-btn');
    const votersList = document.getElementById('voters-list');
    const resultsSummary = document.getElementById('results-summary');
    const roomDisplay = document.getElementById('room-display');
    const shareContainer = document.getElementById('share-container');
    const shareLinkInput = document.getElementById('share-link');
    const copyLinkBtn = document.getElementById('copy-link-btn');
    const copyIcon = document.getElementById('copy-icon');
    const copyText = document.getElementById('copy-text');
    
    // Application State
    let state = {
        username: null,
        roomId: null,
        connected: false,
        selectedCard: null,
        users: {},
        votesRevealed: false
    };
    
    // Event Listeners
    joinBtn.addEventListener('click', joinRoom);
    resetBtn.addEventListener('click', resetVotes);
    revealBtn.addEventListener('click', revealVotes);
    copyLinkBtn.addEventListener('click', copyRoomLink);
    
    cardsElements.forEach(card => {
        card.addEventListener('click', () => selectCard(card));
    });
    
    // Socket.IO event handlers
    socket.on('connect', () => {
        console.log('Connected to server');
    });
    
    socket.on('roomUpdate', (roomData) => {
        state.users = roomData.users;
        state.votesRevealed = roomData.votesRevealed;
        
        updateUI();
    });
    
    // Functions
    function joinRoom() {
        const username = usernameInput.value.trim();
        const roomId = roomIdInput.value.trim();
        
        if (username && roomId) {
            state.username = username;
            state.roomId = roomId;
            state.connected = true;
            
            // Emit join event to server
            socket.emit('joinRoom', {
                username: username,
                roomId: roomId
            });
            
            // Update UI
            joinBtn.textContent = 'Joined';
            joinBtn.disabled = true;
            usernameInput.disabled = true;
            roomIdInput.disabled = true;
            roomDisplay.innerHTML = `<p>Connected to room: <strong>${roomId}</strong></p>`;
            
            // Create and display shareable link
            generateShareableLink(roomId);
            
            // Enable buttons
            resetBtn.disabled = false;
            
            // Enable card selection
            cardsElements.forEach(card => {
                card.classList.add('selectable');
            });
        } else {
            alert('Please enter both a username and room ID');
        }
    }
    
    function selectCard(card) {
        if (!state.connected) {
            alert('Please join a room first');
            return;
        }
        
        // Clear previous selection
        cardsElements.forEach(c => {
            c.classList.remove('selected');
        });
        
        // Select new card
        card.classList.add('selected');
        state.selectedCard = card.dataset.value;
        
        // Emit vote to server
        socket.emit('vote', state.selectedCard);
    }
    
    function resetVotes() {
        if (!state.connected) return;
        
        // Emit reset event to server
        socket.emit('resetVotes');
    }
    
    function revealVotes() {
        if (!state.connected) return;
        
        // Emit reveal event to server
        socket.emit('revealVotes');
    }
    
    function updateUI() {
        // Update voters list
        votersList.innerHTML = '';
        
        let hasVotes = false;
        
        for (const userId in state.users) {
            const user = state.users[userId];
            const voterElement = document.createElement('div');
            voterElement.className = 'voter';
            
            const nameElement = document.createElement('span');
            nameElement.className = 'voter-name';
            nameElement.textContent = user.username;
            
            voterElement.appendChild(nameElement);
            
            if (user.vote) {
                hasVotes = true;
                const voteElement = document.createElement('div');
                voteElement.className = 'voter-card';
                
                if (!state.votesRevealed) {
                    voteElement.classList.add('hidden');
                    voteElement.textContent = '?';
                } else {
                    voteElement.textContent = user.vote;
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
        
        // Enable/disable reveal button
        revealBtn.disabled = !hasVotes;
        
        // Show summary if votes are revealed
        if (state.votesRevealed) {
            showVotingSummary();
        } else {
            resultsSummary.innerHTML = '';
        }
        
        // Reset selected card if votes were reset
        if (!state.votesRevealed) {
            const currentUser = Object.values(state.users).find(user => user.username === state.username);
            if (currentUser && !currentUser.vote) {
                cardsElements.forEach(card => {
                    card.classList.remove('selected');
                });
                state.selectedCard = null;
            }
        }
    }
    
    // Generate and display shareable link
    function generateShareableLink(roomId) {
        // Create the full URL to the room
        const url = new URL(window.location.href);
        url.searchParams.set('room', roomId);
        
        // Display the share container and set the link
        shareContainer.classList.remove('hidden');
        shareLinkInput.value = url.toString();
    }
    
    // Copy room link to clipboard
    function copyRoomLink() {
        shareLinkInput.select();
        shareLinkInput.setSelectionRange(0, 99999); // For mobile devices
        
        try {
            // Copy the text to clipboard
            navigator.clipboard.writeText(shareLinkInput.value)
                .then(() => {
                    // Show copied feedback
                    copyText.textContent = 'Copied!';
                    copyIcon.textContent = '✓';
                    copyLinkBtn.classList.add('copied');
                    copyIcon.classList.add('pulse');
                    
                    // Reset after 2 seconds
                    setTimeout(() => {
                        copyText.textContent = 'Copy';
                        copyIcon.textContent = '📋';
                        copyLinkBtn.classList.remove('copied');
                        copyIcon.classList.remove('pulse');
                    }, 2000);
                })
                .catch(err => {
                    console.error('Could not copy text: ', err);
                    alert('Failed to copy link');
                });
        } catch (err) {
            // Fallback for older browsers
            document.execCommand('copy');
            
            // Show copied feedback
            copyText.textContent = 'Copied!';
            copyIcon.textContent = '✓';
            copyLinkBtn.classList.add('copied');
            
            // Reset after 2 seconds
            setTimeout(() => {
                copyText.textContent = 'Copy';
                copyIcon.textContent = '📋';
                copyLinkBtn.classList.remove('copied');
            }, 2000);
        }
    }
    
    // Check URL for room parameter when page loads
    function checkUrlForRoom() {
        const urlParams = new URLSearchParams(window.location.search);
        const roomFromUrl = urlParams.get('room');
        
        if (roomFromUrl) {
            roomIdInput.value = roomFromUrl;
        }
    }
    
    // Run on page load
    checkUrlForRoom();
    
    function showVotingSummary() {
        if (!state.votesRevealed) return;
        
        // Count votes
        const votes = {};
        let totalVotes = 0;
        
        for (const userId in state.users) {
            const vote = state.users[userId].vote;
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
});

