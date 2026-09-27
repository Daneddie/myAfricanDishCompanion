# Product Requirements Document: MyAfricanDishCompanion

**Status:** Draft v1 · **Owner:** \[Daniel Dyke\] · **Last updated:** September 27, 2026

## 1. Overview

MyAfricanDishCompanion is a cooking companion app that helps users discover African dishes, understand exactly what ingredients (and how much of each) they need, and follow clear, step-by-step instructions until the dish is ready. It's designed to feel like guidance from a knowledgeable relative rather than a clinical recipe database — filling a gap left by dishes that are traditionally taught through oral tradition rather than standardized, written recipes.

## 2. Problem Statement

African cuisine — starting with West Africa — is globally popular but poorly served by existing recipe platforms:

- Recipes are often passed down informally ("a handful," "to taste"), making them hard for first-time cooks to follow.
- Key ingredients (palm oil, egusi, locust beans, crayfish) are often unavailable outside Africa, with no guidance on what to use instead.
- Generic recipe apps don't explain *why* a step matters, so technique and context get lost.
- There's no single place to discover dishes, get properly scaled ingredient lists, and cook with confidence from a single, trustworthy source.

## 3. Goals

- Help users confidently cook West African dishes from start to finish, even with no prior experience.
- Make ingredient sourcing less of a blocker through honest substitution guidance.
- Build a companion people return to regularly, not just a one-time lookup tool.
- Preserve and share the cultural context behind each dish, not just the mechanics of cooking it.

### Non-Goals (for V1)

- Covering all African regions (North, East, Central, Southern Africa) — West Africa only at launch.
- Social features (user-submitted recipes, comments, ratings, sharing between users).
- Meal planning/calendar scheduling beyond a simple shopping list.
- Video or audio-guided cooking.

## 4. Target Users

- **Diaspora cooks** who grew up around these dishes but never learned exact techniques, and now live somewhere ingredients aren't always available.
- **Curious newcomers** who've had West African food and want to cook it themselves.
- **Home cooks within West Africa** who want a reliable reference for dishes outside their usual repertoire (e.g., a Nigerian home cook wanting to try Thieboudienne).

## 5. Scope: V1

**Regional scope:** West African dishes only, spanning multiple countries (e.g., Nigeria, Ghana, Senegal) and categories (Rice Dishes, Soups & Stews, Swallow, Snacks & Small Chops). Additional regions are a post-V1 expansion.

## 6. Features

### 6.1 Discovery & Browsing

- Users can browse dishes **by category** (Rice Dishes, Soups & Stews, Swallow, Snacks & Small Chops) **or by country of origin** (Nigeria, Ghana, Senegal, etc.), toggleable at any time.
- **Search** by dish name or by ingredient (e.g., searching "plantain" surfaces dishes that use it).
- Each dish card in browse/search results shows: name, country flag, prep/cook time, difficulty level (Easy / Medium / Advanced), and dietary tags — enough for a user to decide whether to open it.

### 6.2 Dish Detail Page

- **Photo** of the finished dish, plus visuals of key or unfamiliar ingredients (e.g., egusi seeds, uda pods) to help users recognize what they're buying.
- **Cultural/origin blurb**: a short note on where the dish comes from, when it's traditionally eaten, and any relevant context — kept brief, not a long-form history essay.
- **Dietary tags**: vegetarian/vegan option, contains seafood, spice level, etc., paired with a short adaptation note where relevant (e.g., "swap assorted meat for mushrooms to make this vegetarian").

### 6.3 Ingredients

- Full ingredient list with quantities, scoped to a sensible default serving size.
- **Measurement style toggle**: metric (grams, ml) or cups/spoons — user-selectable per session.
- **Substitution guidance** for hard-to-find ingredients, always paired with an honest note on the impact of substituting (e.g., "no palm oil? Use vegetable oil + a pinch of paprika — you'll lose some of the earthy flavor and deep color").

### 6.4 Cooking Instructions

- Numbered, plain-language steps (not chef jargon), each with an estimated time.
- Occasional "why" tips embedded in steps where technique matters (e.g., why rushing the stew base leads to watery jollof).
- **Two viewing modes:**
  - **Full view** — entire recipe on one scrollable page, for reading ahead.
  - **Start Cooking mode** — a focused, one-step-at-a-time view with large text and simple next/back navigation, designed for use while actively cooking.

### 6.5 Meal Planning

- **"Goes well with"**: each dish suggests 2–3 complementary dishes from the library (e.g., a soup suggesting a swallow to pair it with), linking directly to those dish pages.
- **Shopping list**: users can add one or more dishes to a shopping list, which compiles the required ingredients (grouped by dish) into a single view they can check off while shopping.

### 6.6 Personalization

- **Save to favorites** ("My Cookbook") for quick return access to dishes a user likes.
- **"Cooked this" tracking**: a simple toggle to mark dishes the user has actually made, building a personal cooking history over time.

### 6.7 Tone & Voice

- All copy — blurbs, tips, substitution notes — should read warm and conversational, like a knowledgeable relative teaching in the kitchen. Avoid clinical, database-style language or slick commercial food-blog voice.

## 7. Key User Flows

1. **Discover → Cook**: Browse by category → open a dish → review ingredients (toggle units as needed) → tap Start Cooking → follow steps → mark as cooked.
2. **Plan a meal**: Open a dish → check "Goes well with" suggestions → add both dishes to the shopping list → review combined list before grocery shopping.
3. **Return visit**: Open My Cookbook → revisit a saved favorite or check cooking history.

## 8. Success Metrics (suggested, to be refined)

- % of users who complete "Start Cooking" mode once opened (proxy for successful cooking sessions).
- Number of dishes saved to favorites per active user.
- Repeat usage: users returning to browse or cook a second dish within 30 days.
- Search usage as a % of sessions (signals whether browsing structure alone is sufficient or search is essential).

## 9. Assumptions & Risks

- **Assumption**: West African cuisine has enough breadth and existing recognition to sustain a compelling V1 without needing other regions immediately.
- **Assumption**: Users are willing to accept ingredient substitutions when clearly informed of trade-offs, rather than being blocked entirely by unavailable ingredients.
- **Risk**: Cultural accuracy — dish origin stories and "traditional" claims can be contested across regions/families; content should be reviewed for sensitivity and accuracy before publishing at scale.
- **Risk**: Substitution notes require careful culinary judgment to avoid misleading users about how different the result will taste.

## 10. Future Considerations (Post-V1)

- Expand to additional African regions (East, North, Central, Southern Africa).
- Deeper personalization: notes/ratings per cook, spice-level customization.
- Community-contributed dishes or regional variations.
- Audio-guided or hands-free cooking mode.
- Full meal planner beyond a simple shopping list (weekly planning, cost estimates).

## 11. Open Questions

- Should difficulty/time estimates be fixed per dish, or adjustable based on user-selected serving size?
- How should conflicting regional/family variations of the same dish (e.g., Jollof) be handled as the library grows?
- Should the shopping list eventually combine/sum overlapping ingredients across dishes, or stay grouped by dish (as in V1) for simplicity?