
document.addEventListener("DOMContentLoaded", function () {
    // Canvas setup
    const canvas = document.getElementById("whiteboard");
    const ctx = canvas.getContext("2d");
    const eraserCursor = document.getElementById("eraserCursor");
    
    // Set canvas size to fill the available space
    function resizeCanvas() {
        const container = document.querySelector('.board-container');
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
        drawGrid(); // Redraw grid when resizing
    }
    
    // Initialize canvas size
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Draw grid like Excalidraw
    function drawGrid() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // We'll let the CSS handle the grid background
        // This ensures we don't lose any drawings when resizing
    }
    
    // Socket.io setup
    const socket = io();
    
    // Get room info from URL
    const urlParams = new URLSearchParams(window.location.search);
    const roomId = urlParams.get("room");
    const roomName = urlParams.get("name") || "Untitled Board";
    
    // Set room name in the UI
    document.getElementById("roomName").textContent = roomName;
    document.getElementById("pageTitle").textContent = `${roomName} | Collaboard`;
    
    // Generate a unique user ID if not already set
    let userId = localStorage.getItem("userId");
    if (!userId) {
        userId = Math.random().toString(36).substring(2, 15);
        localStorage.setItem("userId", userId);
    }
    
    // Drawing state variables
    let isDrawing = false;
    let lastX = 0;
    let lastY = 0;
    
    // Tool settings
    let currentTool = "brush";
    let currentColor = "#000000";
    let currentSize = 5;
    let eraserSize = 30;
    
    // Drawing history for undo/redo
    let drawHistory = [];
    let redoStack = [];
    let currentPath = [];
    
    // Initialize ColorPicker
    const colorPicker = document.getElementById("colorPicker");
    colorPicker.addEventListener("change", function() {
        currentColor = this.value;
    });
    
    // Initialize BrushSize
    const brushSize = document.getElementById("brushSize");
    brushSize.addEventListener("change", function() {
        currentSize = parseInt(this.value);
    });
    
    // Initialize EraserSize
    const eraserSizeControl = document.getElementById("eraserSize");
    eraserSizeControl.addEventListener("input", function() {
        eraserSize = parseInt(this.value);
        updateEraserCursor();
    });
    
    // Tool selection
    const tools = document.querySelectorAll(".tool-btn[data-tool]");
    tools.forEach(tool => {
        tool.addEventListener("click", function() {
            // Remove active class from all tools
            tools.forEach(t => t.classList.remove("active"));
            
            // Add active class to clicked tool
            this.classList.add("active");
            
            // Set current tool
            currentTool = this.dataset.tool;
            
            // Hide all settings panels
            document.querySelectorAll(".brush-settings, .eraser-settings").forEach(
                panel => panel.style.display = "none"
            );
            
            // Show settings panel for current tool
            if (currentTool === "brush") {
                document.getElementById("brushSettings").style.display = "block";
            } else if (currentTool === "eraser") {
                document.getElementById("eraserSettings").style.display = "block";
            }
            
            // Update cursor
            updateCursor();
        });
    });
    
    // Update cursor based on selected tool
    function updateCursor() {
        if (currentTool === "eraser") {
            canvas.classList.add("eraser-active");
            updateEraserCursor();
            eraserCursor.style.display = "block";
        } else {
            canvas.classList.remove("eraser-active");
            eraserCursor.style.display = "none";
            canvas.style.cursor = "crosshair";
        }
    }
    
    // Update eraser cursor size
    function updateEraserCursor() {
        eraserCursor.style.width = `${eraserSize}px`;
        eraserCursor.style.height = `${eraserSize}px`;
    }
    
    // Track mouse position for eraser cursor
    canvas.addEventListener("mousemove", function(e) {
        if (currentTool === "eraser") {
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            eraserCursor.style.left = `${e.clientX}px`;
            eraserCursor.style.top = `${e.clientY}px`;
        }
    });
    
    // Canvas drawing event handlers
    canvas.addEventListener("mousedown", startDrawing);
    canvas.addEventListener("mousemove", draw);
    canvas.addEventListener("mouseup", stopDrawing);
    canvas.addEventListener("mouseout", stopDrawing);
    
    // Touch support for mobile devices
    canvas.addEventListener("touchstart", handleTouch);
    canvas.addEventListener("touchmove", handleTouch);
    canvas.addEventListener("touchend", stopDrawing);
    
    // Drawing functions
    function startDrawing(e) {
        isDrawing = true;
        
        // Get mouse position
        const rect = canvas.getBoundingClientRect();
        lastX = e.clientX - rect.left;
        lastY = e.clientY - rect.top;
        
        // Start new path
        currentPath = [{
            tool: currentTool,
            color: currentColor,
            size: currentTool === "eraser" ? eraserSize : currentSize,
            points: [{x: lastX, y: lastY}]
        }];
    }
    
    function draw(e) {
        if (!isDrawing) return;
        
        // Get mouse position
        const rect = canvas.getBoundingClientRect();
        const currentX = e.clientX - rect.left;
        const currentY = e.clientY - rect.top;
        
        // Draw based on selected tool
        ctx.lineJoin = "round";
        ctx.lineCap = "round";
        
        if (currentTool === "brush") {
            ctx.strokeStyle = currentColor;
            ctx.lineWidth = currentSize;
            ctx.beginPath();
            ctx.moveTo(lastX, lastY);
            ctx.lineTo(currentX, currentY);
            ctx.stroke();
        } else if (currentTool === "eraser") {
            ctx.strokeStyle = "#f5f5f5"; // Match background color
            ctx.lineWidth = eraserSize;
            ctx.beginPath();
            ctx.moveTo(lastX, lastY);
            ctx.lineTo(currentX, currentY);
            ctx.stroke();
        }
        
        // Add point to current path
        currentPath[0].points.push({x: currentX, y: currentY});
        
        // Update last position
        lastX = currentX;
        lastY = currentY;
        
        // Send drawing data to server
        socket.emit("draw", {
            roomId,
            userId,
            x0: lastX,
            y0: lastY,
            x1: currentX,
            y1: currentY,
            tool: currentTool,
            color: currentColor,
            size: currentTool === "eraser" ? eraserSize : currentSize
        });
    }
    
    function stopDrawing() {
        if (isDrawing) {
            // Add current path to history
            if (currentPath.length > 0 && currentPath[0].points.length > 1) {
                drawHistory.push(currentPath);
                // Clear redo stack
                redoStack = [];
            }
            
            isDrawing = false;
        }
    }
    
    function handleTouch(e) {
        e.preventDefault(); // Prevent scrolling
        
        if (e.type === "touchstart") {
            startDrawing({
                clientX: e.touches[0].clientX,
                clientY: e.touches[0].clientY
            });
        } else if (e.type === "touchmove") {
            draw({
                clientX: e.touches[0].clientX,
                clientY: e.touches[0].clientY
            });
        }
    }
    
    // Undo/Redo handlers
    document.getElementById("undoBtn").addEventListener("click", undo);
    document.getElementById("redoBtn").addEventListener("click", redo);
    
    function undo() {
        if (drawHistory.length === 0) return;
        
        const lastPath = drawHistory.pop();
        redoStack.push(lastPath);
        
        // Redraw the canvas
        redrawCanvas();
        
        // Notify other users
        socket.emit("undo", {
            roomId,
            userId
        });
    }
    
    function redo() {
        if (redoStack.length === 0) return;
        
        const pathToRedo = redoStack.pop();
        drawHistory.push(pathToRedo);
        
        // Redraw the canvas
        redrawCanvas();
        
        // Notify other users
        socket.emit("redo", {
            roomId,
            userId
        });
    }
    
    function redrawCanvas() {
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Redraw all paths
        drawHistory.forEach(path => {
            path.forEach(segment => {
                if (segment.points.length < 2) return;
                
                ctx.strokeStyle = segment.tool === "eraser" ? "#f5f5f5" : segment.color;
                ctx.lineWidth = segment.size;
                ctx.lineJoin = "round";
                ctx.lineCap = "round";
                
                ctx.beginPath();
                ctx.moveTo(segment.points[0].x, segment.points[0].y);
                
                for (let i = 1; i < segment.points.length; i++) {
                    ctx.lineTo(segment.points[i].x, segment.points[i].y);
                }
                
                ctx.stroke();
            });
        });
    }
    
    // Clear canvas handler
    document.getElementById("clearBtn").addEventListener("click", function() {
        if (confirm("Are you sure you want to clear the board?")) {
            // Clear drawing history
            drawHistory = [];
            redoStack = [];
            
            // Clear canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Notify other users
            socket.emit("clear", {
                roomId,
                userId
            });
            
            showToast("Board cleared", "info");
        }
    });
    
    // Share board handlers
    document.getElementById("shareBtn").addEventListener("click", function() {
        const shareModal = document.getElementById("shareModal");
        const shareLink = document.getElementById("shareLink");
        
        // Set share link
        const url = window.location.href;
        shareLink.value = url;
        
        // Generate a 6-digit code for the board
        const boardCode = Math.floor(100000 + Math.random() * 900000);
        document.getElementById("boardCode").textContent = boardCode;
        
        // Show modal
        shareModal.style.display = "flex";
    });
    
    // Copy link button handler
    document.getElementById("copyLinkBtn").addEventListener("click", function() {
        const shareLink = document.getElementById("shareLink");
        shareLink.select();
        document.execCommand("copy");
        showToast("Link copied to clipboard", "success");
    });
    
    // Copy code button handler
    document.getElementById("copyCodeBtn").addEventListener("click", function() {
        const boardCode = document.getElementById("boardCode").textContent;
        
        // Create a temporary input to copy the code
        const tempInput = document.createElement("input");
        tempInput.value = boardCode;
        document.body.appendChild(tempInput);
        tempInput.select();
        document.execCommand("copy");
        document.body.removeChild(tempInput);
        
        showToast("Board code copied to clipboard", "success");
    });
    
    // Close modal buttons
    document.querySelectorAll(".close-btn, .close-btn2").forEach(btn => {
        btn.addEventListener("click", function() {
            const modal = this.closest(".modal");
            modal.style.display = "none";
        });
    });
    
    // Close modal when clicking outside
    window.addEventListener("click", function(e) {
        const modals = document.querySelectorAll(".modal");
        modals.forEach(modal => {
            if (e.target === modal) {
                modal.style.display = "none";
            }
        });
    });
    
    // Toggle users panel
    document.getElementById("toggleUsersPanel").addEventListener("click", function() {
        const panel = document.querySelector(".users-panel");
        panel.classList.toggle("open");
    });
    
    // Save button handler
    document.getElementById("saveBtn").addEventListener("click", function() {
        // Create a temporary link to download the canvas as an image
        const link = document.createElement("a");
        link.download = `${roomName || "collaboard"}.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
        
        showToast("Board saved as PNG", "success");
    });
    
    // Socket event handlers
    socket.on("connect", function() {
        document.getElementById("connectionStatus").innerHTML = '<i class="fas fa-circle" style="color: var(--success-color);"></i> Connected';
        
        // Join the room
        socket.emit("joinRoom", {
            roomId,
            userId,
            name: getUserName()
        });
    });
    
    socket.on("disconnect", function() {
        document.getElementById("connectionStatus").innerHTML = '<i class="fas fa-circle" style="color: var(--danger-color);"></i> Disconnected';
    });
    
    socket.on("roomUsers", function(data) {
        // Update users count
        document.getElementById("usersCount").innerHTML = `<i class="fas fa-user"></i> ${data.users.length} users`;
        
        // Update users list
        const usersList = document.getElementById("usersList");
        usersList.innerHTML = "";
        
        data.users.forEach(user => {
            const userItem = document.createElement("div");
            userItem.className = "user-item";
            userItem.innerHTML = `
                <span class="user-color" style="background-color: ${getUserColor(user.userId)}"></span>
                <span class="user-name">${user.name || "Anonymous"}</span>
            `;
            usersList.appendChild(userItem);
        });
    });
    
    socket.on("draw", function(data) {
        if (data.userId === userId) return; // Ignore own drawing
        
        ctx.lineJoin = "round";
        ctx.lineCap = "round";
        ctx.strokeStyle = data.tool === "eraser" ? "#f5f5f5" : data.color;
        ctx.lineWidth = data.size;
        
        ctx.beginPath();
        ctx.moveTo(data.x0, data.y0);
        ctx.lineTo(data.x1, data.y1);
        ctx.stroke();
    });
    
    socket.on("clear", function(data) {
        if (data.userId === userId) return; // Ignore own clear
        
        // Clear drawing history
        drawHistory = [];
        redoStack = [];
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        showToast("Board cleared by another user", "info");
    });
    
    // Helper functions
    function getUserName() {
        const user = localStorage.getItem("user");
        if (user) {
            try {
                const userData = JSON.parse(user);
                return userData.name || "Anonymous";
            } catch (e) {
                return "Anonymous";
            }
        }
        return "Anonymous";
    }
    
    function getUserColor(id) {
        // Generate a consistent color based on user ID
        let hash = 0;
        for (let i = 0; i < id.length; i++) {
            hash = id.charCodeAt(i) + ((hash << 5) - hash);
        }
        
        const hue = hash % 360;
        return `hsl(${hue}, 70%, 60%)`;
    }
    
    function showToast(message, type = "info") {
        const toast = document.getElementById("toast");
        const toastMessage = document.getElementById("toastMessage");
        
        // Set icon based on type
        let icon = "info-circle";
        if (type === "success") icon = "check-circle";
        if (type === "error") icon = "exclamation-circle";
        if (type === "warning") icon = "exclamation-triangle";
        
        // Set message and icon
        toastMessage.textContent = message;
        document.querySelector(".toast-icon").className = `toast-icon fas fa-${icon}`;
        
        // Show toast
        toast.classList.add("show");
        
        // Hide after 3 seconds
        setTimeout(() => {
            toast.classList.remove("show");
        }, 3000);
    }
    
    // Initialize
    updateCursor();
});
