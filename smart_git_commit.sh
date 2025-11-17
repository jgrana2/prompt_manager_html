#!/bin/bash

# Smart Git Commit Script with LLM-Generated Messages
# Automatically analyzes git diff and generates appropriate commit messages
# Compatible with Mac M1

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
API_KEY="${OPENAI_API_KEY:-}"
API_URL="https://api.openai.com/v1/chat/completions"
MODEL="gpt-5-nano-2025-08-07"

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

print_info() {
    echo -e "${CYAN}ℹ $1${NC}"
}

# Check dependencies
check_dependencies() {
    if ! command -v curl &> /dev/null; then
        print_error "curl is required but not installed"
        exit 1
    fi
    
    if ! command -v jq &> /dev/null; then
        print_error "jq is required but not installed. Install with: brew install jq"
        exit 1
    fi
    
    if [[ -z "$API_KEY" ]]; then
        print_error "OpenAI API key not found. Set OPENAI_API_KEY environment variable."
        echo "Example: export OPENAI_API_KEY='sk-...'"
        exit 1
    fi
}

# Check if we're in a git repository
check_git_repo() {
    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        print_error "Not in a git repository!"
        exit 1
    fi
}

# Get all changes (staged, unstaged, and untracked) for logical grouping
get_all_changes() {
    local all_changes=""
    
    # Get staged changes
    local staged
    staged=$(git diff --cached --name-status 2>/dev/null)
    if [[ -n "$staged" ]]; then
        all_changes="$staged"
    fi
    
    # Get unstaged changes
    local unstaged
    unstaged=$(git diff --name-status 2>/dev/null)
    if [[ -n "$unstaged" ]]; then
        if [[ -n "$all_changes" ]]; then
            all_changes="$all_changes\n$unstaged"
        else
            all_changes="$unstaged"
        fi
    fi
    
    # Get untracked files
    local untracked
    untracked=$(git ls-files --others --exclude-standard 2>/dev/null)
    if [[ -n "$untracked" ]]; then
        local untracked_formatted
        untracked_formatted=$(echo "$untracked" | sed 's/^/A\t/')
        if [[ -n "$all_changes" ]]; then
            all_changes="$all_changes\n$untracked_formatted"
        else
            all_changes="$untracked_formatted"
        fi
    fi
    
    if [[ -z "$all_changes" ]]; then
        print_warning "No changes detected. Make changes to files first."
        exit 1
    fi
    
    echo -e "$all_changes" | sort -u
}

# Get git diff for analysis (backward compatibility)
get_git_changes() {
    get_all_changes
}

# Get detailed git diff
get_detailed_diff() {
    git diff --cached 2>/dev/null || git diff
}

# Analyze file content to determine logical purpose
analyze_file_purpose() {
    local file="$1"
    local diff_content="$2"
    local purpose=""
    
    # Analyze diff content for keywords and patterns
    if echo "$diff_content" | grep -qi "fix\|bug\|error\|issue\|problem\|resolve"; then
        purpose="bug-fix"
    elif echo "$diff_content" | grep -qi "test\|spec\|mock\|jest\|cypress"; then
        purpose="testing"
    elif echo "$diff_content" | grep -qi "style\|css\|color\|font\|margin\|padding\|design"; then
        purpose="styling"
    elif echo "$diff_content" | grep -qi "feat\|feature\|add\|new\|implement"; then
        purpose="feature"
    elif echo "$diff_content" | grep -qi "refactor\|cleanup\|optimize\|improve"; then
        purpose="refactor"
    elif echo "$diff_content" | grep -qi "config\|setting\|env\|api\|key"; then
        purpose="config"
    elif echo "$diff_content" | grep -qi "modal\|dialog\|popup\|ui\|interface"; then
        purpose="ui-component"
    elif echo "$diff_content" | grep -qi "chain\|sequence\|flow\|process"; then
        purpose="workflow"
    elif echo "$diff_content" | grep -qi "doc\|readme\|comment\|documentation"; then
        purpose="documentation"
    else
        # Fallback to file extension analysis
        case "$file" in
            *.html|*.htm) purpose="frontend" ;;
            *.css|*.scss|*.sass|*.less) purpose="styling" ;;
            *.js|*.ts|*.jsx|*.tsx) purpose="backend-logic" ;;
            *.json|*.xml|*.yaml|*.yml) purpose="config" ;;
            *.md|*.txt|README*) purpose="documentation" ;;
            *.sh|*.bash) purpose="deployment" ;;
            *) purpose="general" ;;
        esac
    fi
    
    echo "$purpose"
}

# Group files by logical purpose
group_files_logically() {
    local changes="$1"
    
    # Create associative arrays for grouping
    declare -A file_groups
    declare -A group_files
    declare -A group_diffs
    
    echo "$changes" | while read -r status file; do
        if [[ -n "$file" && -f "$file" ]]; then
            # Get diff for this specific file
            local file_diff
            file_diff=$(git diff --cached -- "$file" 2>/dev/null || git diff -- "$file" 2>/dev/null || echo "")
            
            # Analyze the file's purpose based on content
            local purpose
            purpose=$(analyze_file_purpose "$file" "$file_diff")
            
            # Store file in appropriate group
            if [[ -z "${group_files[$purpose]}" ]]; then
                group_files[$purpose]="$file"
            else
                group_files[$purpose]="${group_files[$purpose]} $file"
            fi
            
            # Store diff content for the group
            group_diffs[$purpose]="${group_diffs[$purpose]}\n\n--- Changes in $file ---\n$file_diff"
        fi
    done
    
    # Output grouped results
    for purpose in "${!group_files[@]}"; do
        echo "GROUP:$purpose"
        echo "FILES:${group_files[$purpose]}"
        echo "DIFF:${group_diffs[$purpose]}"
        echo "---"
    done
}

# Generate commit message for specific file group
generate_group_commit_message() {
    local purpose="$1"
    local files="$2"
    local diff_content="$3"
    
    local commit_type=""
    local description=""
    
    case "$purpose" in
        "bug-fix")
            commit_type="fix"
            description="resolve issues and bugs"
            ;;
        "feature")
            commit_type="feat"
            description="add new functionality"
            ;;
        "styling"|"ui-component")
            commit_type="style"
            description="improve UI components and styling"
            ;;
        "workflow")
            commit_type="feat"
            description="enhance workflow and process logic"
            ;;
        "refactor")
            commit_type="refactor"
            description="improve code structure and organization"
            ;;
        "config")
            commit_type="chore"
            description="update configuration and settings"
            ;;
        "testing")
            commit_type="test"
            description="add or improve tests"
            ;;
        "documentation")
            commit_type="docs"
            description="update documentation"
            ;;
        "deployment")
            commit_type="ci"
            description="update deployment and CI scripts"
            ;;
        *)
            commit_type="chore"
            description="general improvements"
            ;;
    esac
    
    # Use AI to generate more specific message
    local prompt="Generate a concise git commit message for these changes:

Commit Type: $commit_type
Files: $files
Purpose: $description

Changes (first 1000 chars):
${diff_content:0:1000}

Rules:
- Use format: '$commit_type: <specific description>'
- Be specific about what was changed
- Keep under 50 characters
- Capitalize first word after colon
- Focus on the impact/benefit

Generate only the commit message:"

    local response
    response=$(curl -s "$API_URL" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $API_KEY" \
        -d "{
            \"model\": \"$MODEL\",
            \"messages\": [
                {
                    \"role\": \"user\",
                    \"content\": $(echo "$prompt" | jq -R -s .)
                }
            ],
            \"max_tokens\": 60,
            \"temperature\": 0.7
        }" 2>/dev/null)
    
    local ai_message
    ai_message=$(echo "$response" | jq -r '.choices[0].message.content // empty' 2>/dev/null)
    
    if [[ -n "$ai_message" ]]; then
        echo "$ai_message"
    else
        # Fallback message
        echo "$commit_type: $(echo $description | sed 's/^./\U&/')"
    fi
}

# Categorize files by type (simplified version for backwards compatibility)
categorize_changes() {
    local changes="$1"
    
    echo "$changes" | while read -r status file; do
        case "$file" in
            *.html|*.htm) echo "Frontend/UI" ;;
            *.css|*.scss|*.sass|*.less) echo "Styling/CSS" ;;
            *.js|*.ts|*.jsx|*.tsx) echo "JavaScript/Logic" ;;
            *.json|*.xml|*.yaml|*.yml) echo "Configuration" ;;
            *.md|*.txt|README*) echo "Documentation" ;;
            *.sh|*.bash) echo "Scripts/Deployment" ;;
            *test*|*spec*) echo "Testing" ;;
            *) echo "General" ;;
        esac
    done | sort -u | tr '\n' ', ' | sed 's/,$//'
}

# Generate commit message using LLM
generate_commit_message() {
    local changes="$1"
    local detailed_diff="$2"
    local categories="$3"
    
    print_info "Analyzing changes with AI..."
    
    # Prepare the prompt for the LLM
    local prompt="You are a senior software engineer writing git commit messages. 

Analyze these git changes and generate a concise, professional commit message following conventional commits format.

File changes:
$changes

Categories: $categories

Detailed diff (first 2000 characters):
${detailed_diff:0:2000}

Rules:
1. Start with capital letter
2. Use conventional commits format (feat:, fix:, style:, refactor:, docs:, etc.)
3. Be specific but concise (50 characters max for title)
4. Include brief description of what changed
5. Focus on the 'what' and 'why', not the 'how'

Generate only the commit message, nothing else."

    # Make API call to OpenAI
    local response
    response=$(curl -s "$API_URL" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $API_KEY" \
        -d "{
            \"model\": \"$MODEL\",
            \"messages\": [
                {
                    \"role\": \"user\",
                    \"content\": $(echo "$prompt" | jq -R -s .)
                }
            ],
            \"max_tokens\": 100,
            \"temperature\": 0.7
        }")
    
    # Extract message from response
    local commit_message
    commit_message=$(echo "$response" | jq -r '.choices[0].message.content // empty' 2>/dev/null)
    
    if [[ -z "$commit_message" ]]; then
        print_error "Failed to generate commit message from AI"
        echo "API Response: $response"
        exit 1
    fi
    
    echo "$commit_message"
}

# Generate multiple commit message options
generate_multiple_options() {
    local changes="$1"
    local detailed_diff="$2"
    local categories="$3"
    
    print_info "Generating multiple commit message options..."
    
    local prompts=(
        "Generate a conventional commit message focusing on the main functionality change"
        "Generate a commit message emphasizing the user impact and benefits"
        "Generate a technical commit message focusing on the code changes made"
    )
    
    local messages=()
    
    for i in "${!prompts[@]}"; do
        local prompt="${prompts[$i]}

File changes:
$changes

Categories: $categories

Detailed diff (first 1500 characters):
${detailed_diff:0:1500}

Rules: Start with capital letter, be concise (50 chars max), use conventional commits format.
Generate only the commit message, nothing else."

        local response
        response=$(curl -s "$API_URL" \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer $API_KEY" \
            -d "{
                \"model\": \"$MODEL\",
                \"messages\": [
                    {
                        \"role\": \"user\",
                        \"content\": $(echo "$prompt" | jq -R -s .)
                    }
                ],
                \"max_tokens\": 80,
                \"temperature\": 0.8
            }")
        
        local message
        message=$(echo "$response" | jq -r '.choices[0].message.content // empty' 2>/dev/null)
        
        if [[ -n "$message" ]]; then
            messages+=("$message")
        fi
    done
    
    printf '%s\n' "${messages[@]}"
}

# Main execution
main() {
    print_section "Smart Git Commit with AI"
    
    check_dependencies
    check_git_repo
    
    # Get changes
    local changes
    changes=$(get_git_changes)
    
    local detailed_diff
    detailed_diff=$(get_detailed_diff)
    
    local categories
    categories=$(categorize_changes "$changes")
    
    print_section "Changes Detected"
    echo "$changes"
    echo ""
    print_info "Categories: $categories"
    echo ""
    
    # Choose mode
    print_section "Select Mode"
    echo "1. Single AI-generated commit message"
    echo "2. Multiple AI-generated options to choose from"
    echo "3. Logical grouping - separate commits by purpose"
    echo "4. Show detailed diff and exit"
    echo "0. Exit"
    
    read -p "Select mode (0-4): " mode
    
    case $mode in
        1)
            local commit_message
            commit_message=$(generate_commit_message "$changes" "$detailed_diff" "$categories")
            
            print_section "Generated Commit Message"
            echo -e "${GREEN}\"$commit_message\"${NC}"
            echo ""
            
            read -p "Use this commit message? (Y/n): " confirm
            if [[ ! $confirm =~ ^[Nn]$ ]]; then
                git add . 2>/dev/null || true
                git commit -m "$commit_message"
                print_success "Changes committed successfully!"
                
                read -p "Push to remote? (y/N): " push_confirm
                if [[ $push_confirm =~ ^[Yy]$ ]]; then
                    git push
                    print_success "Changes pushed to remote!"
                fi
            else
                print_warning "Commit cancelled"
            fi
            ;;
            
        2)
            # Generate options and store in temporary file for compatibility
            local temp_file="/tmp/commit_options_$$"
            generate_multiple_options "$changes" "$detailed_diff" "$categories" > "$temp_file"
            
            # Read options into array (compatible with older bash)
            local options=()
            local option_count=0
            while IFS= read -r line; do
                if [[ -n "$line" ]]; then
                    options+=("$line")
                    ((option_count++))
                fi
            done < "$temp_file"
            
            rm -f "$temp_file"
            
            if [[ ${#options[@]} -eq 0 ]]; then
                print_error "Failed to generate commit message options"
                exit 1
            fi
            
            print_section "Generated Commit Message Options"
            for i in $(seq 0 $((${#options[@]} - 1))); do
                echo "$((i+1)). ${options[$i]}"
            done
            echo "$((${#options[@]}+1)). Enter custom message"
            echo "0. Cancel"
            
            read -p "Select option (0-$((${#options[@]}+1))): " selection
            
            local chosen_message=""
            if [[ $selection -gt 0 && $selection -le ${#options[@]} ]]; then
                chosen_message="${options[$((selection-1))]}"
            elif [[ $selection -eq $((${#options[@]}+1)) ]]; then
                read -p "Enter custom commit message: " chosen_message
            else
                print_warning "Cancelled"
                exit 0
            fi
            
            if [[ -n "$chosen_message" ]]; then
                print_section "Selected Commit Message"
                echo -e "${GREEN}\"$chosen_message\"${NC}"
                
                git add . 2>/dev/null || true
                git commit -m "$chosen_message"
                print_success "Changes committed successfully!"
                
                read -p "Push to remote? (y/N): " push_confirm
                if [[ $push_confirm =~ ^[Yy]$ ]]; then
                    git push
                    print_success "Changes pushed to remote!"
                fi
            fi
            ;;
            
        3)
            print_section "Logical Grouping - Separate Commits by Purpose"
            
            print_info "This will:"
            print_info "1. Reset git staging area"
            print_info "2. Analyze all changed files logically" 
            print_info "3. Group files by purpose (bug-fix, feature, styling, etc.)"
            print_info "4. Create separate commits for each logical group"
            echo ""
            
            read -p "Continue with logical grouping? (Y/n): " continue_logical
            if [[ $continue_logical =~ ^[Nn]$ ]]; then
                print_warning "Cancelled"
                exit 0
            fi
            
            # Reset staging area to start fresh
            print_info "Resetting staging area..."
            git reset HEAD . 2>/dev/null || true
            
            # Get all changes (now unstaged)
            changes=$(get_all_changes)
            
            # Debug: Show what changes we detected
            print_info "All changes detected:"
            echo "$changes"
            echo ""
            
            # Use temporary files for Bash 3.2 compatibility
            local temp_analysis="/tmp/git_analysis_$$"
            local temp_groups="/tmp/git_groups_$$"
            local temp_summary="/tmp/git_summary_$$"
            
            # Clear temporary files
            > "$temp_analysis"
            
            # Analyze each file and store results
            echo "$changes" | while IFS=$'\t' read -r status file; do
                # Skip empty lines and ensure we have both status and filename
                if [[ -n "$file" && -n "$status" ]]; then
                    # Clean the filename (remove any extra whitespace)
                    file=$(echo "$file" | xargs)
                    
                    # Only process if file actually exists or is a known git status
                    if [[ -f "$file" ]] || [[ "$status" == "A" ]] || [[ "$status" == "D" ]] || [[ "$status" == "M" ]] || [[ "$status" == "R"* ]] || [[ "$status" == "C"* ]]; then
                        local file_diff=""
                        
                        # Get diff content based on status
                        case "$status" in
                            "A")  # Added file
                                if [[ -f "$file" ]]; then
                                    file_diff=$(git diff --cached -- "$file" 2>/dev/null || cat "$file" 2>/dev/null || echo "New file")
                                fi
                                ;;
                            "D")  # Deleted file
                                file_diff="File deleted"
                                ;;
                            "M"|"R"*|"C"*)  # Modified, renamed, or copied file
                                file_diff=$(git diff --cached -- "$file" 2>/dev/null || git diff -- "$file" 2>/dev/null || echo "")
                                ;;
                        esac
                        
                        local purpose
                        purpose=$(analyze_file_purpose "$file" "$file_diff")
                        
                        # Store analysis results
                        echo "$purpose:$file:$(echo "$file_diff" | head -c 500)" >> "$temp_analysis"
                    fi
                fi
            done
            
            # Check if we have any analysis results
            if [[ ! -s "$temp_analysis" ]]; then
                print_error "No files were successfully analyzed"
                rm -f "$temp_analysis" "$temp_groups" "$temp_summary"
                exit 1
            fi
            
            print_info "Analysis results:"
            cat "$temp_analysis"
            echo ""
            
            # Group files by purpose (compatible with Bash 3.2)
            local unique_purposes
            unique_purposes=$(cut -d':' -f1 "$temp_analysis" | sort -u)
            
            # Create groups summary
            echo "" > "$temp_summary"
            local group_count=0
            
            for purpose in $unique_purposes; do
                if [[ -n "$purpose" ]]; then
                    ((group_count++))
                    local files_in_group
                    files_in_group=$(grep "^$purpose:" "$temp_analysis" | cut -d':' -f2 | tr '\n' ' ')
                    
                    echo "GROUP_${group_count}:$purpose:$files_in_group" >> "$temp_groups"
                    
                    print_info "Group $group_count: $purpose"
                    echo "Files: $files_in_group"
                    echo ""
                fi
            done
            
            if [[ $group_count -eq 0 ]]; then
                print_error "No files found for grouping"
                rm -f "$temp_analysis" "$temp_groups" "$temp_summary"
                exit 1
            fi
            
            read -p "Proceed with $group_count separate commits? (Y/n): " proceed
            if [[ $proceed =~ ^[Nn]$ ]]; then
                print_warning "Cancelled"
                rm -f "$temp_analysis" "$temp_groups" "$temp_summary"
                exit 0
            fi
            
            # Create commits for each group
            local commit_count=0
            
            while IFS=':' read -r group_id purpose files_list; do
                if [[ -n "$purpose" && -n "$files_list" ]]; then
                    print_section "Creating Commit for: $purpose"
                    print_info "Files: $files_list"
                    
                    # Get diff content for this group
                    local group_diff=""
                    for file in $files_list; do
                        if [[ -f "$file" ]]; then
                            local file_diff
                            file_diff=$(git diff --cached -- "$file" 2>/dev/null || git diff -- "$file" 2>/dev/null || echo "")
                            group_diff="$group_diff\n--- $file ---\n$file_diff"
                        fi
                    done
                    
                    # Generate commit message for this group
                    local commit_message
                    commit_message=$(generate_group_commit_message "$purpose" "$files_list" "$group_diff")
                    
                    if [[ -z "$commit_message" ]]; then
                        # Fallback commit message
                        case "$purpose" in
                            "bug-fix") commit_message="fix: Resolve issues and bugs" ;;
                            "feature") commit_message="feat: Add new functionality" ;;
                            "styling"|"ui-component") commit_message="style: Improve UI and styling" ;;
                            "workflow") commit_message="feat: Enhance workflow logic" ;;
                            *) commit_message="chore: Update $purpose" ;;
                        esac
                    fi
                    
                    print_info "Generated message: \"$commit_message\""
                    echo ""
                    
                    # Add and commit files in this group one by one
                    local files_added=0
                    local files_array=($files_list)
                    
                    print_info "Adding files to staging area:"
                    for file in "${files_array[@]}"; do
                        file=$(echo "$file" | xargs)  # Clean whitespace
                        if [[ -n "$file" ]] && ([[ -f "$file" ]] || git ls-files --error-unmatch "$file" >/dev/null 2>&1); then
                            print_info "  + $file"
                            git add "$file"
                            ((files_added++))
                        else
                            print_warning "  ! $file (not found or not a git file)"
                        fi
                    done
                    
                    if [[ $files_added -gt 0 ]]; then
                        print_info "Committing $files_added files..."
                        git commit -m "$commit_message"
                        print_success "✓ Committed: $commit_message"
                        ((commit_count++))
                    else
                        print_warning "No valid files to commit for group: $purpose"
                    fi
                    echo ""
                fi
            done < "$temp_groups"
            
            # Cleanup temporary files
            rm -f "$temp_analysis" "$temp_groups" "$temp_summary"
            
            print_success "Created $commit_count logical commits successfully!"
            
            read -p "Push all commits to remote? (y/N): " push_all
            if [[ $push_all =~ ^[Yy]$ ]]; then
                git push
                print_success "All commits pushed to remote!"
            fi
            ;;
            
        4)
            print_section "Detailed Diff"
            echo "$detailed_diff"
            ;;
            
        0)
            print_warning "Exiting"
            exit 0
            ;;
            
        *)
            print_error "Invalid selection"
            exit 1
            ;;
    esac
}

# Run main function
main "$@"