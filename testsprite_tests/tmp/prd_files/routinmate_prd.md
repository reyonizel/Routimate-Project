# RoutinMate – Product Requirements Document

## Overview
RoutinMate is a React Native (Expo) mobile app that helps users build and track daily routines, and connects them with a single "mate" for mutual accountability.

## Core Features

### 1. Authentication
- Email + password registration with OTP email verification
- Login with email + password
- Session persistence via Supabase Auth

### 2. Onboarding
- New users set gender, bio, and interests after first registration
- Onboarding is shown once; redirects to home on completion

### 3. Routine Management (Home Tab)
- View routines in list or calendar view
- Mark routines as complete/incomplete per day
- Create routines with: name, frequency (daily/weekly/monthly), notification time, target days
- Edit routine name and time inline
- Delete routines
- Toggle today as a rest day (skips routine tracking for the day)

### 4. Match Discovery (Mate Tab)
- Browse other users not yet matched
- Send a match request to a user
- View incoming match requests
- Accept or reject incoming requests
- Only one active match at a time per user

### 5. Direct Messages (DM Tab)
- Chat with matched mate
- Send and receive text messages
- DM tab is locked (shows placeholder) if user has no active match
- Unmatch option available from mate profile

### 6. User Profile (Profile Tab)
- View and edit bio, display name, birth date, location
- Upload/delete/pin profile photos
- View achievement score and routine stats
- Toggle Pro status
- Log out

### 7. Mate Profile
- View matched mate's routines, photos, bio, and stats
- Unmatch from mate profile screen

## Non-Functional Requirements
- Turkish UI language throughout
- Pinterest-style design: pill buttons, no borders, shadow cards, red accent (#E60023)
- Works on iOS, Android, and Web (Expo web)
- Backend: Supabase (Postgres + Auth + Storage)
