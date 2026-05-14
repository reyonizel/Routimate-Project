
# TestSprite AI Testing Report(MCP)

---

## 1️⃣ Document Metadata
- **Project Name:** routinmate
- **Date:** 2026-05-10
- **Prepared by:** TestSprite AI Team

---

## 2️⃣ Requirement Validation Summary

#### Test TC001 Register, verify OTP, and reach onboarding
- **Test Code:** [TC001_Register_verify_OTP_and_reach_onboarding.py](./TC001_Register_verify_OTP_and_reach_onboarding.py)
- **Test Error:** TEST FAILURE

The registration process could not be completed — the password field did not accept input and the app did not advance to the OTP verification step.

Observations:
- The auth-password-input remained empty after multiple typing attempts.
- Clicking 'Hesap Oluştur' did not navigate away from the registration form.
- The show-password toggle (auth-toggle-password) is not present on the page.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/32e16244-5034-459f-aa4f-d3d6192986af/fbf8d0da-fd34-463f-9798-26b7f7d43353
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC002 Complete first-time onboarding after authentication
- **Test Code:** [TC002_Complete_first_time_onboarding_after_authentication.py](./TC002_Complete_first_time_onboarding_after_authentication.py)
- **Test Error:** TEST BLOCKED

The test could not be run — the registration page is not reachable, so the onboarding flow cannot be started.

Observations:
- Navigating to /auth/register shows a "404 The requested path could not be found" page.
- The page contains no interactive elements or the expected auth inputs (auth-name-input, auth-email-input, auth-password-input).

- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/32e16244-5034-459f-aa4f-d3d6192986af/c10d83b9-0498-4895-85fb-faf8dea41814
- **Status:** BLOCKED
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC003 Log in and enter the main tabs
- **Test Code:** [TC003_Log_in_and_enter_the_main_tabs.py](./TC003_Log_in_and_enter_the_main_tabs.py)
- **Test Error:** TEST BLOCKED

The test could not be run — the login form could not be submitted because the UI provides no accessible submit control and keyboard submission did not succeed.

Observations:
- No visible or clickable submit button is present in the page's interactive elements.
- Pressing Enter while the password input was focused did not navigate away from the auth page or reveal the main app tabs.
- The show-password toggle (auth-toggle-password) and an explicit auth submit control are not present in the interactive element list.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/32e16244-5034-459f-aa4f-d3d6192986af/8839521a-1c5e-4e86-8589-48ebb37a20aa
- **Status:** BLOCKED
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC004 Toggle rest day for today
- **Test Code:** [TC004_Toggle_rest_day_for_today.py](./TC004_Toggle_rest_day_for_today.py)
- **Test Error:** TEST BLOCKED

The test could not be run — the login page is not reachable, preventing authentication and the rest-day flow from being exercised.

Observations:
- Navigating to /login returned a 404 page with message 'The requested path could not be found'.
- The root page showed no interactive elements (SPA did not finish loading), preventing access to the app.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/32e16244-5034-459f-aa4f-d3d6192986af/350f95ce-6584-4324-bbc2-7a79696d8223
- **Status:** BLOCKED
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC005 See the DM locked state without a match
- **Test Code:** [TC005_See_the_DM_locked_state_without_a_match.py](./TC005_See_the_DM_locked_state_without_a_match.py)
- **Test Error:** TEST BLOCKED

The DM tab could not be reached — the server returned a 404 and the SPA did not render, so the locked DM placeholder could not be verified.

Observations:
- Direct navigation to /tabs/dm returned a 404 page: "The requested path could not be found"
- The root page (/) showed a blank page where the SPA did not render (0 interactive elements)

- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/32e16244-5034-459f-aa4f-d3d6192986af/0e0ba088-65ec-45cf-b94d-73832a9f207f
- **Status:** BLOCKED
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC006 Complete onboarding and enter the app
- **Test Code:** [TC006_Complete_onboarding_and_enter_the_app.py](./TC006_Complete_onboarding_and_enter_the_app.py)
- **Test Error:** TEST FAILURE

Advancing past the gender selection step did not work — the onboarding did not proceed to the next screen after repeated attempts.

Observations:
- The onboarding page stayed on the gender selection screen (two gender cards and a "Devam Et" button) after multiple clicks.
- No age input or any subsequent onboarding fields appeared, despite trying different gender card elements and the 'Devam Et' button several times.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/32e16244-5034-459f-aa4f-d3d6192986af/2a1dbc49-434d-474d-99d7-92981f8bd5cd
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC007 View routines in the home list
- **Test Code:** [TC007_View_routines_in_the_home_list.py](./TC007_View_routines_in_the_home_list.py)
- **Test Error:** TEST FAILURE

The home screen could not be reached — the /tabs/ route returned a 404 and the routines view could not be verified.

Observations:
- The page displays '404 The requested path could not be found'.
- No interactive elements were present on the page (0 interactive elements).
- The routines list or any home-screen UI was not visible, so verification could not be completed.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/32e16244-5034-459f-aa4f-d3d6192986af/7b77973c-92b0-4ea6-8746-efe154af544b
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC008 Mark a routine complete and incomplete
- **Test Code:** [TC008_Mark_a_routine_complete_and_incomplete.py](./TC008_Mark_a_routine_complete_and_incomplete.py)
- **Test Error:** TEST BLOCKED

The Tabs/home feature could not be reached — the UI route returned a 404 so the routine list and toggle controls are not available.

Observations:
- Navigated to http://localhost:8082/tabs/ and the page shows '404 The requested path could not be found'.
- The page contains 0 interactive elements, so routines cannot be located or toggled.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/32e16244-5034-459f-aa4f-d3d6192986af/c8eb97b3-2fbb-4211-9b1f-5d6e7b62aa1a
- **Status:** BLOCKED
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC009 Create a new routine
- **Test Code:** [TC009_Create_a_new_routine.py](./TC009_Create_a_new_routine.py)
- **Test Error:** TEST BLOCKED

The test could not be run — the login page and SPA are not available, so the UI required to perform authentication and create a routine cannot be reached.

Observations:
- Navigated to /login and saw '404 The requested path could not be found'
- No interactive elements were present on the page (SPA did not render)

- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/32e16244-5034-459f-aa4f-d3d6192986af/6ab8688d-25be-4fac-994a-2542b9d6554c
- **Status:** BLOCKED
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC010 Create a new routine from the create screen
- **Test Code:** [TC010_Create_a_new_routine_from_the_create_screen.py](./TC010_Create_a_new_routine_from_the_create_screen.py)
- **Test Error:** TEST BLOCKED

The routine creation flow could not be reached — the application returned a 404 for the /tabs route and no UI controls were available to continue the test.

Observations:
- The page displays '404 The requested path could not be found'.
- No interactive elements or routine creation UI are present on the page.

- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/32e16244-5034-459f-aa4f-d3d6192986af/51f79474-540f-4b9d-a27c-889c166c62c7
- **Status:** BLOCKED
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC011 Open direct messages after a match exists
- **Test Code:** [TC011_Open_direct_messages_after_a_match_exists.py](./TC011_Open_direct_messages_after_a_match_exists.py)
- **Test Error:** TEST BLOCKED

The test could not be run — no active matched conversation exists for the current user, so the conversation view could not be verified.

Observations:
- The DM page shows an empty-state message: "Henüz Bir Mate Bulamadın" and a "Rutinmate Bul" button.
- No conversation list or message area is present on the page.

- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/32e16244-5034-459f-aa4f-d3d6192986af/93c347c8-2bf6-4a87-ad91-f304109be80d
- **Status:** BLOCKED
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC012 Respond to an incoming match request
- **Test Code:** [TC012_Respond_to_an_incoming_match_request.py](./TC012_Respond_to_an_incoming_match_request.py)
- **Test Error:** TEST BLOCKED

The test could not be run — the application's login/auth UI did not become available, preventing the authentication and subsequent match-request actions from being performed.

Observations:
- The root page (http://localhost:8082/) rendered blank with no interactive elements.
- Navigating to /login returned a 404 page.
- Navigating to /#/login produced a blank page and waiting did not reveal the auth inputs.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/32e16244-5034-459f-aa4f-d3d6192986af/78b64d61-147f-410a-8615-ea08eb0f3a01
- **Status:** BLOCKED
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC013 Set today as a rest day and return to normal routine tracking
- **Test Code:** [TC013_Set_today_as_a_rest_day_and_return_to_normal_routine_tracking.py](./TC013_Set_today_as_a_rest_day_and_return_to_normal_routine_tracking.py)
- **Test Error:** TEST BLOCKED

The feature could not be reached — the /tabs route returned a 404 page, preventing the test from interacting with the app UI.

Observations:
- Navigating to /tabs showed a 404 page with the text 'The requested path could not be found'.
- No interactive elements were visible on the page, so the toggle actions cannot be performed.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/32e16244-5034-459f-aa4f-d3d6192986af/c82487c7-a992-498d-9107-f706809e7ed7
- **Status:** BLOCKED
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC014 Send an accountability mate request
- **Test Code:** [TC014_Send_an_accountability_mate_request.py](./TC014_Send_an_accountability_mate_request.py)
- **Test Error:** TEST BLOCKED

The test could not be run — the single-page app (SPA) did not render and no interactive UI elements were available to perform the steps.

Observations:
- The page shows a blank white screen and the browser reports 0 interactive elements.
- Multiple navigations and waits were attempted but the discovery/mate interface never appeared.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/32e16244-5034-459f-aa4f-d3d6192986af/9f4d1f80-ef8d-4d05-8b86-948fb42f3dfd
- **Status:** BLOCKED
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC015 Send a match request
- **Test Code:** [TC015_Send_a_match_request.py](./TC015_Send_a_match_request.py)
- **Test Error:** TEST BLOCKED

The test could not be run — the application UI required for the scenario did not load, so the authentication and discovery flows could not be reached.

Observations:
- The root and hash routes (http://localhost:8082/ and http://localhost:8082/#/login) displayed a blank page with no interactive elements.
- Direct navigation to http://localhost:8082/login returned a 404 page.
- Login form inputs (auth-name-input, auth-email-input, auth-password-input, auth-submit-btn) were not present on the page.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/32e16244-5034-459f-aa4f-d3d6192986af/e2d54a7b-ea84-4c16-b214-6c33afa8d659
- **Status:** BLOCKED
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC016 Chat with a matched mate
- **Test Code:** [TC016_Chat_with_a_matched_mate.py](./TC016_Chat_with_a_matched_mate.py)
- **Test Error:** TEST BLOCKED

The test could not be run — the login route is not reachable so authentication and subsequent DM actions cannot be performed.

Observations:
- Navigated to /login and the page displayed '404 The requested path could not be found'
- The page shows 0 interactive elements, so the login form is not present

- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/32e16244-5034-459f-aa4f-d3d6192986af/0cfce4fa-8105-4a8c-ad0c-9e1d78f7a4ce
- **Status:** BLOCKED
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC017 Send a message in direct messages
- **Test Code:** [TC017_Send_a_message_in_direct_messages.py](./TC017_Send_a_message_in_direct_messages.py)
- **Test Error:** TEST BLOCKED

The test could not be run — the DM/chat view has no matched member and no message input, so sending a message cannot be performed.

Observations:
- The DM view displays the message 'Henüz Bir Mate Bulamadın' and a 'Rutinmate Bul' button.
- No message input field or existing conversation messages are present on the page.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/32e16244-5034-459f-aa4f-d3d6192986af/9cee9885-7116-4868-9b19-ffc7bc59d5da
- **Status:** BLOCKED
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC018 Browse accountability mate discovery cards
- **Test Code:** [TC018_Browse_accountability_mate_discovery_cards.py](./TC018_Browse_accountability_mate_discovery_cards.py)
- **Test Error:** TEST FAILURE

The mate tab is not accessible — the requested path returns a 404 page and discovery cards cannot be viewed.

Observations:
- Navigated to /tabs/mate and the page displayed '404 The requested path could not be found'
- No interactive elements or discovery cards are present on the page
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/32e16244-5034-459f-aa4f-d3d6192986af/13a9891c-820d-48f3-b026-a8b5f9306728
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC019 Return from rest day to normal tracking
- **Test Code:** [TC019_Return_from_rest_day_to_normal_tracking.py](./TC019_Return_from_rest_day_to_normal_tracking.py)
- **Test Error:** TEST BLOCKED

The test could not be run — the login feature could not be reached because the /login path returns a 404 and no interactive authentication UI is present.

Observations:
- The /login page shows '404 The requested path could not be found'
- No interactive elements (login fields or buttons) were present on the page
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/32e16244-5034-459f-aa4f-d3d6192986af/15452e39-76ed-4648-9954-bc652fa912a0
- **Status:** BLOCKED
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC020 Switch between routine list and calendar views
- **Test Code:** [TC020_Switch_between_routine_list_and_calendar_views.py](./TC020_Switch_between_routine_list_and_calendar_views.py)
- **Test Error:** TEST FAILURE

The home routines view could not be tested because the tabs route is not accessible.

Observations:
- Navigating to /tabs/ showed a 404 page with the text 'The requested path could not be found'.
- No interactive elements were present on the page to switch to calendar or list views.
- The SPA did not render the expected UI on the /tabs/ route.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/32e16244-5034-459f-aa4f-d3d6192986af/212ee4b0-fa94-49db-a92e-42224652217c
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC021 Handle incoming match requests
- **Test Code:** [TC021_Handle_incoming_match_requests.py](./TC021_Handle_incoming_match_requests.py)
- **Test Error:** TEST BLOCKED

The test could not be run — the app UI did not render, so the incoming requests feature could not be reached.

Observations:
- The page is blank and shows 0 interactive elements after navigation.
- Clicking the incoming-requests tab twice did not reveal any UI or controls.
- No visible controls exist to accept or reject incoming requests.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/32e16244-5034-459f-aa4f-d3d6192986af/24642d22-1b08-4e74-b3ff-0213baa13b92
- **Status:** BLOCKED
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC022 Quick edit a routine from home
- **Test Code:** [TC022_Quick_edit_a_routine_from_home.py](./TC022_Quick_edit_a_routine_from_home.py)
- **Test Error:** TEST BLOCKED

The feature could not be reached — the application's SPA did not render, preventing interaction with the login or home screens.

Observations:
- Navigations to /, /login, /#/login, and /#/home produced a blank page with 0 interactive elements.
- The page screenshot shows an empty white screen (the SPA appears not to have loaded).
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/32e16244-5034-459f-aa4f-d3d6192986af/6fbacbc4-607e-42da-a73d-14c52d18ce52
- **Status:** BLOCKED
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC023 Browse match discovery cards
- **Test Code:** [TC023_Browse_match_discovery_cards.py](./TC023_Browse_match_discovery_cards.py)
- **Test Error:** TEST BLOCKED

The test could not be run — the login page is unreachable so authentication and subsequent discovery steps cannot be performed.

Observations:
- Navigated to /login and the page displays '404 The requested path could not be found'.
- No interactive elements (inputs or buttons) are available on the page.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/32e16244-5034-459f-aa4f-d3d6192986af/0643b6a8-03cf-4fa8-8556-4169f2c16db6
- **Status:** BLOCKED
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC024 Log out from the profile
- **Test Code:** [TC024_Log_out_from_the_profile.py](./TC024_Log_out_from_the_profile.py)
- **Test Error:** TEST BLOCKED

The unauthenticated entry flow could not be reached — the SPA did not load and the page remained blank, preventing the test from running.

Observations:
- The app at http://localhost:8082/ loaded but displayed a blank page with 0 interactive elements.
- Two waits for the SPA to render were attempted and the UI did not become interactive.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/32e16244-5034-459f-aa4f-d3d6192986af/4449c9e5-d318-472e-b5e9-04b9738868e2
- **Status:** BLOCKED
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC025 Update profile details and manage photos
- **Test Code:** [TC025_Update_profile_details_and_manage_photos.py](./TC025_Update_profile_details_and_manage_photos.py)
- **Test Error:** TEST BLOCKED

The profile feature could not be reached — the UI did not render and no profile edit controls were available.

Observations:
- The page at http://localhost:8082/ rendered blank/skeleton content with 0 interactive elements.
- Navigating to /(tabs)/profile left the page in a placeholder/skeleton state; no bio input or photo management controls appeared.

- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/32e16244-5034-459f-aa4f-d3d6192986af/911b034f-f94f-4bbd-96ea-2625dd5a759c
- **Status:** BLOCKED
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC026 Update profile bio and personal details
- **Test Code:** [TC026_Update_profile_bio_and_personal_details.py](./TC026_Update_profile_bio_and_personal_details.py)
- **Test Error:** TEST FAILURE

The profile edit feature could not be tested — the profile page did not expose any editable bio or personal information inputs, or a save/edit control.

Observations:
- The profile route loaded but shows skeleton/placeholder content; no profile fields or edit button are visible.
- Interactive elements are limited to navigation tabs (e.g., element indexes 102, 109, 116, 125, 132); no inputs with testIDs or edit controls were found on the page.

- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/32e16244-5034-459f-aa4f-d3d6192986af/87318ba0-d8f2-4e81-bc54-90538a68d8e6
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC027 Delete a routine from the home screen
- **Test Code:** [TC027_Delete_a_routine_from_the_home_screen.py](./TC027_Delete_a_routine_from_the_home_screen.py)
- **Test Error:** TEST BLOCKED

The feature could not be reached — the /tabs/ page is not available so routines cannot be accessed or deleted.

Observations:
- Navigation to http://localhost:8082/tabs/ showed a 404 page with the message "The requested path could not be found".
- No interactive elements were present on the page, so the routine list and delete controls are not accessible.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/32e16244-5034-459f-aa4f-d3d6192986af/49b77d6f-7796-4206-807a-05c57f3dfc8d
- **Status:** BLOCKED
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC028 Toggle Pro status and log out
- **Test Code:** [TC028_Toggle_Pro_status_and_log_out.py](./TC028_Toggle_Pro_status_and_log_out.py)
- **Test Error:** TEST BLOCKED

The profile and main app pages could not be reached — the UI is not available to run the test.

Observations:
- The root URL showed no interactive elements; the SPA did not render.
- Navigating to /tabs/profile returned a 404 page stating 'The requested path could not be found'.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/32e16244-5034-459f-aa4f-d3d6192986af/45d72797-8d3c-404e-a368-f4e22ffd2b6a
- **Status:** BLOCKED
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC029 Delete a routine from the create flow
- **Test Code:** [TC029_Delete_a_routine_from_the_create_flow.py](./TC029_Delete_a_routine_from_the_create_flow.py)
- **Test Error:** TEST BLOCKED

The test could not be run — the login page (and the SPA) could not be reached, preventing authentication and all subsequent routine operations.

Observations:
- Navigating to /login showed a 404 page with the message 'The requested path could not be found'.
- No interactive elements were present and the SPA did not render, so the login form and app UI are inaccessible.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/32e16244-5034-459f-aa4f-d3d6192986af/310bb682-6df9-48d1-bd78-7e97437d1670
- **Status:** BLOCKED
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC030 View matched mate profile details
- **Test Code:** [TC030_View_matched_mate_profile_details.py](./TC030_View_matched_mate_profile_details.py)
- **Test Error:** TEST BLOCKED

The mate profile page could not be reached — the SPA did not render and no UI was available to verify the profile.

Observations:
- The page shows 0 interactive elements and a blank/white screenshot.
- Multiple navigations to / and /mate-profile plus waits did not produce any visible UI.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/32e16244-5034-459f-aa4f-d3d6192986af/6309c4f0-1d4f-4f91-95ef-7b05ea4d8dca
- **Status:** BLOCKED
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---


## 3️⃣ Coverage & Matching Metrics

- **0.00** of tests passed

| Requirement        | Total Tests | ✅ Passed | ❌ Failed  |
|--------------------|-------------|-----------|------------|
| ...                | ...         | ...       | ...        |
---


## 4️⃣ Key Gaps / Risks
{AI_GNERATED_KET_GAPS_AND_RISKS}
---