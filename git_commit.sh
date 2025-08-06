#!/bin/bash

# Git Commit Script for Prompt Manager
# Organizes commits by logical code sections
# Compatible with Mac M1

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_section() {
    echo -e "${BLUE}=== $1 ===${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    print_error "Not in a git repository!"
    exit 1
fi

# Show current status
print_section "Current Git Status"
git status --short

echo ""
print_section "Available Commit Options"
echo "1. Frontend/UI Components"
echo "2. Backend/Core Functionality"
echo "3. User Experience (UX)" 
echo "4. Bug Fixes"
echo "5. Feature Enhancements"
echo "6. All Changes (Comprehensive)"
echo "7. Individual File Commits"
echo "8. Custom commit message"
echo "0. Exit"

echo ""
read -p "Select commit type (0-8): " choice

case $choice in
    1)
        print_section "Frontend/UI Components"
        git add prompts.html
        git commit -m "Fix missing textarea in new prompt modal"
        print_success "Frontend changes committed"
        ;;
    
    2)
        print_section "Backend/Core Functionality"
        git add index.js
        git commit -m "Enhance chained prompt functionality to pass previous output to next step"
        print_success "Backend changes committed"
        ;;
    
    3)
        print_section "User Experience (UX)"
        git add style.css
        git commit -m "Improve modal and component styling for better user experience"
        print_success "UX improvements committed"
        ;;
    
    4)
        print_section "Bug Fixes"
        git add prompts.html index.js
        git commit -m "Fix textarea display and enhancement conflicts in modal"
        print_success "Bug fixes committed"
        ;;
    
    5)
        print_section "Feature Enhancements"
        git add index.js
        git commit -m "Add sequential processing to chained prompts with context passing"
        print_success "Feature enhancements committed"
        ;;
    
    6)
        print_section "All Changes (Comprehensive)"
        git add .
        git commit -m "$(cat <<'EOF'
Enhance prompt manager with chained functionality and UI fixes

- Fix missing textarea in new prompt modal
- Implement sequential chaining where each step receives previous output
- Improve modal and component styling
- Remove problematic textarea enhancement that caused display issues

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
        print_success "All changes committed with comprehensive message"
        ;;
    
    7)
        print_section "Individual File Commits"
        
        # Frontend - Modal fix
        git add prompts.html
        git commit -m "Fix new prompt modal textarea display issue"
        print_success "prompts.html committed"
        
        # Backend - Chain enhancement
        git add index.js  
        git commit -m "Implement sequential chaining with previous output context"
        print_success "index.js committed"
        
        # UI - Styling updates
        git add style.css
        git commit -m "Update component styles and modal appearance"
        print_success "style.css committed"
        ;;
    
    8)
        print_section "Custom Commit Message"
        echo "Available files to add:"
        git status --porcelain | grep "^ M" | awk '{print "  " $2}'
        echo ""
        
        read -p "Enter files to add (space-separated, or '.' for all): " files
        read -p "Enter commit message: " message
        
        if [[ -z "$message" ]]; then
            print_error "Commit message cannot be empty"
            exit 1
        fi
        
        # Capitalize first letter of commit message
        message="$(tr '[:lower:]' '[:upper:]' <<< ${message:0:1})${message:1}"
        
        git add $files
        git commit -m "$message"
        print_success "Custom commit completed"
        ;;
    
    0)
        print_warning "Exiting without committing"
        exit 0
        ;;
    
    *)
        print_error "Invalid selection"
        exit 1
        ;;
esac

echo ""
print_section "Post-Commit Status"
git log --oneline -5
echo ""
print_success "Commit completed successfully!"

# Ask about pushing
echo ""
read -p "Do you want to push changes to remote? (y/N): " push_choice
if [[ $push_choice =~ ^[Yy]$ ]]; then
    print_section "Pushing to Remote"
    git push
    print_success "Changes pushed to remote repository"
else
    print_warning "Changes not pushed. Run 'git push' manually when ready."
fi