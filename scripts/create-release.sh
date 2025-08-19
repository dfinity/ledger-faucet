#!/bin/bash

# Token Faucet Release Helper Script
# This script helps create properly formatted releases

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_usage() {
    echo "Usage: $0 <version>"
    echo ""
    echo "Recommended workflow:"
    echo "  1. First create a beta for testing:"
    echo "     $0 1.0.0-beta.1    # Creates prerelease on GitHub"
    echo "  2. After testing, create stable release:"
    echo "     $0 1.0.0           # Creates latest release on GitHub"
    echo ""
    echo "Other examples:"
    echo "  $0 1.1.0               # Minor release"
    echo "  $0 1.0.1               # Patch release"
    echo "  $0 2.0.0-rc.1          # Release candidate"
    echo "  $0 1.0.0-alpha.1       # Alpha prerelease"
    echo ""
    echo "This script will:"
    echo "  1. Validate the version format"
    echo "  2. Check that you're on the main branch"
    echo "  3. Ensure working directory is clean"
    echo "  4. Create and push the git tag"
    echo "  5. GitHub Actions will automatically build and release"
    echo ""
    echo "Note: Versions with '-' (e.g., beta.1) are marked as prereleases"
}

validate_version() {
    local version=$1
    # Basic semantic version validation (allows prerelease)
    if [[ ! $version =~ ^[0-9]+\.[0-9]+\.[0-9]+(-[a-zA-Z0-9]+(\.[a-zA-Z0-9]+)*)?$ ]]; then
        echo -e "${RED}Error: Invalid version format. Use semantic versioning (e.g., 1.0.0, 1.0.0-beta.1)${NC}"
        exit 1
    fi
}

check_git_status() {
    # Check if we're on main branch
    current_branch=$(git rev-parse --abbrev-ref HEAD)
    if [ "$current_branch" != "main" ]; then
        echo -e "${YELLOW}Warning: You're not on the main branch (current: $current_branch)${NC}"
        read -p "Continue anyway? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi

    # Check if working directory is clean
    if [[ -n $(git status --porcelain) ]]; then
        echo -e "${RED}Error: Working directory is not clean. Please commit or stash your changes.${NC}"
        git status --short
        exit 1
    fi

    # Pull latest changes
    echo -e "${BLUE}Pulling latest changes...${NC}"
    git pull origin "$current_branch"
}

create_release() {
    local version=$1
    local tag="v$version"
    local is_prerelease=""

    # Check if this is a prerelease
    if [[ $version == *"-"* ]]; then
        is_prerelease=" (prerelease)"
    else
        is_prerelease=" (latest release)"
    fi

    # Check if tag already exists
    if git rev-parse "$tag" >/dev/null 2>&1; then
        echo -e "${RED}Error: Tag $tag already exists${NC}"
        exit 1
    fi

    echo -e "${GREEN}Creating release $tag$is_prerelease...${NC}"
    echo ""
    echo "This will:"
    echo "  1. Create git tag: $tag"
    echo "  2. Push the tag to origin"
    echo "  3. Trigger GitHub Actions to build and create the release$is_prerelease"
    echo ""
    read -p "Continue? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Release cancelled."
        exit 0
    fi

    # Create and push tag
    git tag -a "$tag" -m "Release $tag"
    git push origin "$tag"

    echo -e "${GREEN}✓ Tag $tag created and pushed successfully!${NC}"
    echo ""
    echo -e "${BLUE}GitHub Actions is now building the release...${NC}"
    echo "You can monitor the progress at:"
    echo "https://github.com/$(git remote get-url origin | sed 's/.*github.com[:/]\([^.]*\).*/\1/')/actions"
    echo ""
    echo "The release will be available at:"
    echo "https://github.com/$(git remote get-url origin | sed 's/.*github.com[:/]\([^.]*\).*/\1/')/releases/tag/$tag"
}

# Main script
if [ $# -ne 1 ]; then
    print_usage
    exit 1
fi

if [ "$1" = "-h" ] || [ "$1" = "--help" ]; then
    print_usage
    exit 0
fi

version=$1

echo -e "${BLUE}Token Faucet Release Helper${NC}"
echo "=================================="

validate_version "$version"
check_git_status
create_release "$version"
