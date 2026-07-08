# Order of Elites [[orderofelites.com](https://orderofelites.com)]

Order of Elites is an online text-based PBBG (Persistent Browser-Based Game). The virtual world is a John Wick-inspired universe where players are elite assassins living under a strict code. Players can earn money through missions, kill each other (featuring permanent death), chat, and send DMs. The website's aesthetic is designed to imitate a luxury, neo-noir style.

## Key Design Features
Glassmorphism panels — Semi-transparent backgrounds with backdrop-filter: blur and subtle border glow on hover.
Neon accents — Cyan glow on interactive elements via box-shadow and text-shadow
Full-bleed background — AI-generated Continental office scene, fixed with vignette overlay
Micro-animations — Fade-in, slide-up for modals; pulse for loading states; smooth hover transitions on all interactive elements
Progress bar — Animated rank progress with glowing dot indicator
Server clock — Live UTC clock in Orbitron font with cyan glow

---

## Ideas & TODO List

- **Cities**: Add specifics to each city. E.g., Drug production in Mexico is cheaper.
- **Travel**: Reduce the realistic travel times by somewhere between 4x and 20x.
- **Elite Coins**:
  - *TODO*: Think of a way so players can earn Elite coins.
  - *TODO*: Add more ways to spend the coins.

---

## General Terms

- Players are called **Elites**.
- The safehouse hotel is called **The Citadel**.
- The head of the Citadel in each city is called the **Chairman of the Citadel**.
- **Syndicates** are clans of Elites with shared budgets and goals.
- The ruling body of the Elites is the **Grand Council**, which consists of 5 members, rotated each month.
- The **Order of Elites** is a set of rules written by the Grand Council and is enforced by the Chairmans of the Citadels.
- **Chairmans of the Citadels** are assigned by the Grand Council.
- If a player breaks any rule of the Order of Elite, they are automatically **Blacklisted** or tagged as **Persona non-grata**.
- **Seals** are promises between players, automatically enforced by the game.

---

## Grand Council

- The Grand Council consists of **5 members** serving a term.
- The Grand Council members:
  - Can chat in a separate chat dedicated to them and the Chairman of the Citadel.
  - Do not have a cooldown entering/leaving the Citadel.
  - Cannot do missions.
  - Cannot assassinate players.
  - Assign the Chairman of the Citadels.
  - Get protection skills boost.
  - Can Blacklist players or tag them as Persona non-grata.
- Members of the Grand Council are **rotated every week, 00:00 UTC**.
- Members create and publish the **Order of the Elites** — a message and ruleset for all players.
- The Order of the Elites is written and sent to review by one of the members, and needs to be accepted by at least **3 other members**.

---

## Chairman of the Citadel

- Any player above the required Rank can be assigned to be the **Chairman of the Citadel** by the Grand Council.
- The Chairman can **Blacklist** players or tag them as **Persona non-grata**.

---

## Syndicate

- A **Syndicate** can be created by any player above the required Rank.
- Syndicates have **Presidents** (initially the creator), upon death of whom the role of leader will be transferred to the **Vice President** of the Syndicate.
- The 3rd hierarchical position of the Syndicate is **Manager**, the others are **Soldiers**.
- All members of a Syndicate can contribute to the budget of the Syndicate.
- The President and Vice President can promote a Soldier to Manager.
- **Managers** are allowed to review applications and invite other members to the Syndicate.
- Syndicates have a list of top contributors in budget and total kill number.
- Players get access to a chat exclusively for the Syndicate.
- Syndicates can declare war on, or ally with other Syndicates.
- War declarations are shown on the Syndicate page, but alliances are shown only if both parties accept it. Any alliance request or war declaration is shown on the Syndicate chat.
- A Syndicate may have up to **20 members**.
- A Syndicate may put a **head price** (bounty) on any member of another Syndicate which has been declared war on.
- Syndicates have a name and optionally a motto.

---

## Citadel

- When a Player is inside the Citadel they get a **huge amount of protection boost**, so it’s practically impossible for others to kill them, unless the attacker is very high ranked and extremely more powerful.
- Maximum time a player can stay in the Citadel is **12 hours**.
- Leaving the Citadel sets a **1-hour cooldown** before it can be reentered.
- If in the Citadel, a player is unable to do actions other than messaging and chatting.
- The Citadel has a global budget called the **Treasury**, which is filled by all players paying an **x% commission fee** on any transaction.
- The Chairman can tag players as **Persona Non Grata**, which results in:
  - Increasing the cooldown of Citadel reentering by 1 hour (total 2 hours).
  - Reducing the time a player can stand in Citadel by 3 hours (total 9 hours).

---

## Signup

- Players are required to fill the following fields to sign up:
  - Unique username consisting of letters and underscores.
  - Password.
  - Email address for account recovery.
- Players may also choose the **Play as a Guest** option, which automatically assigns a username starting with `guest_`. Guests will have limited functionality allowed.
- Players spawn in a random city.
- If they had a previous account that has been killed, they can re-register from the dead account to gain the following advantages:
  - They may set their old nickname to be visible on their new profile.
  - The experience earned is **2x multiplied** until they reach the experience of their previous account.
  - **40% of the money** from their previous account is transferred to the new account.

---

## Gameplay

When a player registers in the game, they start with:
- **$0** money
- **0 Elite coins**

- **0 shooting skills**
- **0 driving skills**
- **0 protection skills**

Other attributes and actions:
- Players have 3 levels of health indicator (**Well**, **Injured**, **Critically hurt**), but under the hood health is a 0-100 decimal.
- Players have location status: **In Citadel**, **In Apartment**, **Driving**.
- Players can do **Missions** and **Assassination Missions** to earn money, rank, and Elite coins.
- Players can **train** any of their skills for free and with a paid service.
- Players can **send money** to other players paying a **2% transaction fee** to the Treasury.
- Players can **attempt a kill** on another player (9 hours cooldown if succeeded, otherwise 3 hours).
- Players can **rate other players 1 to 5 stars** and leave a review.
- Players can **travel** to other countries (realistic travel times based on distance, but scaled down).

---

## Messaging

- **Public chat**: Accessible by all players per city; messages in the chat will be visible to all those who are in the same city.
- **Direct Messages (DMs)**: Players can DM each other.

---

## Kill Mechanics

- Players can search for another player's location and status using **Elite coins**:
  - **1 Elite Coin**: Check if player is in the same city you are.
  - **1 Elite Coin**: Get the status of the player in the current city (Driving/Inside Citadel/In the House, on the Airplane).
  - **5 Elite Coins**: Find the city the player is in.
- Players may also do a **blind assassination attempt** by guessing the other player’s city and status.
- Players can kill another player if their rank is above the other player or at most **2 Ranks below**.

**If the attack is successful and the target is killed:**
- **10% of their money** is transferred to the killer.
- **40% of their money** is transferred to their new account.

**If the attack is not successful and the target survives:**
- The attacked player will lose **$10,000** for each percent of health they lost.
- Both the attacker and survivor may lose health, weapons, cars, and armor.

### Methods of Assassination
There are 3 ways in which Elites can make an attempt on another's life:
1. **Regular Assassination attempt**: Offers the highest chance of succeeding, but also poses a significant risk of the attacker getting backfired on and shot.
2. **Drive-by Assassination attempt**: Moderate chances of killing with moderate chances of getting killed.
3. **Sniping attempt**: Low chances of killing with low chances of getting killed.

### Factors Affecting Outcome
- **Operational Budget**: Money amount dedicated, chosen by the attacker.
- ...

---

## Seal

- Available to **pro players only**.
- A **Seal** is a sharable contract (a promise) between 2 players.
- A player writes the conditions in a free text field, mentioning what they do for the player, and what the other player will do for them.
- The Seal is then sent to the 2nd player to sign.
- Once the Seal is signed, it is bound, and the 2nd player is obliged to do whatever was set by player 1.
- An **LLM API call** will take game logs of the 2 players and verify if the conditions are satisfied.

---

## Bank

- Players can deposit money into the bank with the following benefits:
  - Upon death, **35% of the bank money is lost**, and **65% is saved** to be sent to their new account (as opposed to cash money where 100% is lost).
  - Players get **0.5% compound interest** bonus each day money is kept in the bank.
- Doing a Bank action (depositing or cashing out) sets a **12-hour cooldown** before another action can be performed.

---

## Missions

There are **4 main types of missions**:

### Stakeout
- Solo basic mission available from Rank 1.
- Earns a $0–$200 randomly chosen amount + a base amount for that rank, capped at $1,000 at rank 5.

### Recon Op
- A little more advanced than Stakeout, offering a slightly higher reward of Exp and money.
- Available after playing for approximately 1 day.

### Extraction
- Requires **2 players** working together in the same city.
- 1 of the players must have the required driving skills.
- The initiator earns a random amount of money ranging from **$40,000 - $100,000** and should share with the other player.
- The amount of money earned depends on the driver's skills.

### High-Profile Assassination
- Requires **4 players** working together in the same city.
- 2 of the players must have the required amount of Assassination skills.
- 1 of the players must have the required amount of Driving skills.
- The initiator earns a random amount of money ranging from **$500,000 - $2,000,000** and should share with the other players.
- The amount of money earned depends on the required skills of the players.

### Solo Assassination Missions (Cross-City)
- May involve traveling to 1 or more countries.
- Players can choose from a number of missions, each with different price tags and cities.
- Upon a successful kill, they earn money, Rank experience, and assassination skills, but their kill count does not increase.

### Mission Details

| Mission Type | Cooldown | Exp | Earnings (Min) | Earnings (Max) | Random Range | Max Profit Rank |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Stakeout** | 6m | 10 | $0 | $1,000 | $200 | 5 |
| **Recon Op** | 20m | 20 | $1,000 | $5,000 | $500 | 10 |
| **Extraction** | 1h | 75 | $10,000 | $20,000 | - | - |
| **High-Profile Assassination** | 8h | 500 | $500,000 | $2,000,000 | - | - |
| **Assassination Mission / Elite Assassination** | 9h / 3h | 300 | $100,000 | $5,000,000 | - | - |

> [!NOTE]
> **TODO**: Add 1 or 2 more solo missions here, requiring a gun or car or both.

---

## Black Market

The Black Market can be used to earn money and experience through drug and alcohol production. Drug production is a chain of material productions. There are 4 types of products to produce and sell, each unlocked at different ranks:

### Product Chains

#### 1. Alcohol
- **Precursor**: Grains (Base price: `$40/kg`)
- **Production Chain**:
  - `Grains` $\rightarrow$ `Brewer` $\rightarrow$ `Alcohol`
    - Consumes: 7 kg grain per hour
    - Produces: 4 liters of alcohol per hour
- **Sales Chain**:
  - `Alcohol` $\rightarrow$ `Distributors` $\rightarrow$ `Money`
    - Sells: 11 liters of alcohol per hour
    - Base Price: `$100/liter`

#### 2. Cannabis
- **Precursor**: Seed (Base price: `$100/kg`)
- **Production Chain**:
  - `Seed` $\rightarrow$ `Botanist` $\rightarrow$ `Leaves`
    - Consumes: 3 kg seed per hour
    - Produces: 13 kg leaves per hour
  - `Leaves` $\rightarrow$ `Trimmer` $\rightarrow$ `Cannabis`
    - Consumes: 7 kg leaves
    - Produces: 4 kg cannabis
- **Sales Chain**:
  - `Cannabis` $\rightarrow$ `Dealer` $\rightarrow$ `Money`
    - Sells: 9 kg per hour
    - Base Price: `$800/kg`

#### 3. Methamphetamine
- **Precursor**: Meth Precursors (1 barrel = `$5,000`), Gasoline
- **Production Chain**:
  - `Precursor Chemicals` $\rightarrow$ `Chemist` $\rightarrow$ `Solution`
  - `Solution` $\rightarrow$ `Cook` $\rightarrow$ `Meth Oil`
  - `Meth Oil` $\rightarrow$ `Crystalizer` $\rightarrow$ `Crystal Meth`
- **Sales Chain**:
  - `Crystal Meth` $\rightarrow$ `Dealers` $\rightarrow$ `Money`

#### 4. Cocaine
- **Precursor**: Coca Leaves, Cocaine Precursors, Gasoline
- **Production Chain**:
  - `Coca Leaves` $\rightarrow$ `Picker` $\rightarrow$ `Raw Crop`
  - `Raw Crop` $\rightarrow$ `Paste Maker` $\rightarrow$ `Paste`
  - `Paste` $\rightarrow$ `Refiner` $\rightarrow$ `Coke Bricks`
- **Sales Chain**:
  - `Coke Bricks` $\rightarrow$ `Dealer` $\rightarrow$ `Money`

---

### Mechanics & Operations

- **Reclaiming Profits**: Money made through drugs must be reclaimed/withdrawn, which requires the player to be in the city where the drug is sold.
- **Smuggling**: Drugs can be shipped/smuggled to another city for higher returns.
- **Professionals**: Players start with **10 professionals** available, which increases by 5 per rank (max 160).
  - Professionals must be assigned to specific roles (e.g., Brewer), which takes time to train (initially 1 hour).
  - Once trained, players can purchase precursor items with 1 click. Professionals will consume these items gradually to generate the final product/money.
- **Supply & Demand**: Prices are driven by market supply and demand:
  - **Alcohol** is the least affected by other players selling.
  - **Cannabis** is moderately affected.
  - **Meth** and **Cocaine** are highly volatile, and their selling prices are heavily affected by the current supply in the city.
  - Players can view a histogram of market shares and sellers.

### Drug Price Formula

$$\text{Price per unit} = B \times \left( \frac{P \times A}{(P \times A) + S} \right) \times R$$

Where:
- **$B$**: Base price of the drug.
- **$P$**: Population (active log-ins in the last 24 hours).
- **$A$**: Market price fluctuation absorber (higher values make the price less sensitive to supply/demand).
- **$S$**: Current supply (units sold/lost in the last 24 hours).
- **$R$**: Random noise factor (between `0.92` and `1.08`).

#### Examples

- **Cannabis** ($P = 100, A = 50, B = \$800, R = 1, S = 500$):
  $$\text{Price} = 800 \times \left( \frac{100 \times 50}{(100 \times 50) + 500} \right) = \$727 \text{ per unit}$$

- **Methamphetamine** ($P = 100, A = 10, B = \$5,000, R = 1, S = 500$):
  $$\text{Price} = 5000 \times \left( \frac{100 \times 10}{(100 \times 10) + 500} \right) = \$3,333 \text{ per unit}$$

---

## Businesses

- **Profit Sharing**: When players purchase items, the owner of that business type gets a percentage of the money. The amount depends on the percentage of businesses in the city they own.
- **Availability**: Each city has **1,000 units** of each business type.
- **Asset Release**: When a business owner is killed, their businesses become available for purchase.
- **Profit Calculation**: Players earn profit based on their shares in that city. 
  - *Example*: If Player 1 owns 500 gas stations in New York and Player 2 owns 100, a $10 gasoline sale gives $5 to Player 1 and $1 to Player 2.

### Types of Businesses

- **Alcohol Grain Silo**: Profit when players purchase grain for alcohol production.
- **Oil Refinery**: Profit when players purchase gasoline.
- **Cannabis Greenhouse**: Profit when players purchase seed for cannabis production.
- **Chemical Lab**: Profit when players purchase precursor chemicals for methamphetamine and cocaine production.
- **Coca Plantation**: Profit when players purchase coca leaves for cocaine production.
- **Hospital**: Profit when players get hurt and spend money on healing.
- **Airport**: Profit on travel fees for private aircraft or commercial flights.
- **Arsenal**: Profit from a small fee when players purchase a gun.
- **Real Estate Agency**: Profit from a small fee when players purchase a house.
- **Car Factory**: Profit from a small fee when players purchase a car.

### Pricing Model
Business prices are dynamically adjusted by a daily cron task. The task evaluates the profitability of each business type over the last 24 hours and sets a price targeting a **10-day return on investment (ROI)**. Prices are rounded to clean intervals like:
- `$65,000` / `$70,000` / `$75,000` ...
- `$150,000` / `$200,000` / `$250,000` ...
- `$1,000,000` / `$1,500,000` / `$2,000,000` ...

---

## Skills

There are **5 skills** players can improve:

- **Assassination**:
  - Improves chances of assassination in missions or against real players.
  - Improves chances of successful backfire.
- **Drive-by Shooting**:
  - Improves chances of assassination and backfire in a drive-by.
- **Sniping**:
  - Improves chances of assassination when sniping other Elites.
- **Driving**:
  - Improves chances of succeeding in driving missions as a driver.
  - Improves chances of backfire and escaping when attacked by another player via drive-by.
- **Protection**:
  - Improves chances of survival when being attacked by another player.

---

## Training

| Training Type | Cooldown | Exp | Price | Points Gains |
| :--- | :---: | :---: | :---: | :---: |
| **Assassination** | 3m | 3 | $0 | 1 |
| **Drive-by Shooting** | 3m | 3 | $0 | 1 |
| **Sniping** | 3m | 3 | $0 | 1 |
| **Driving** | 3m | 3 | $0 | 1 |
| **Defense** | 3m | 3 | $0 | 1 |
| **Paid Assassination** | 20m | 10 | $10,000 | 5 |
| **Paid Drive-by Shooting** | 20m | 10 | $20,000 | 5 |
| **Paid Sniping** | 20m | 10 | $20,000 | 5 |
| **Paid Driving** | 20m | 10 | $2,000 | 5 |
| **Paid Protection** | 20m | 10 | $10,000 | 5 |

---

## Ranks

There are 30 ranks and their corresponding cumulative abilities. Unmentioned functionalities are available at Rank 1.

| Rank | Exp Needed | Days Needed | Unlocks |
| :--- | :---: | :---: | :--- |
| **Rank 1** | 0 | 0 | Stakeout mission, Alcohol production |
| **Rank 2** | 296 | 1 | Recon Op mission |
| **Rank 3** | 1,000 | 2 | Rate/Review other Elites |
| **Rank 4** | 2,228 | 5 | Extraction mission (initiator or driver) |
| **Rank 5** | 4,630 | - | Cannabis production |
| **Rank 6** | 8,000 | 10 | High-Profile Assassination (driver or initiator) |
| **Rank 7** | 12,533 | - | - |
| **Rank 8** | 18,328 | - | Assassination mission, High-Profile Assassination (Assassin) |
| **Rank 9** | 25,481 | 20 | Be assassinated, enter Citadel, join a Syndicate, Meth/Coke production |
| **Rank 10** | 34,080 | - | - |
| **Rank 11** | 44,213 | 30 | Assassinate Elites |
| **Rank 12** | 55,968 | - | - |
| **Rank 13** | 69,433 | - | - |
| **Rank 14** | 84,696 | - | - |
| **Rank 15** | 101,845 | 60 | Can create a Syndicate |
| **Rank 16** | 120,968 | - | - |
| **Rank 17** | 142,153 | - | - |
| **Rank 18** | 165,488 | - | - |
| **Rank 19** | 191,061 | - | - |
| **Rank 20** | 218,960 | 120 | Can become the Chairman of the Citadel |
| **Rank 21** | 249,273 | - | - |
| **Rank 22** | 282,088 | - | - |
| **Rank 23** | 317,493 | - | - |
| **Rank 24** | 355,576 | - | - |
| **Rank 25** | 396,425 | 210 | - |
| **Rank 26** | 440,128 | - | - |
| **Rank 27** | 486,773 | - | - |
| **Rank 28** | 536,448 | - | - |
| **Rank 29** | 589,241 | - | - |
| **Rank 30** | 645,240 | 365 | Can become member of the Grand Council |

---

## Weapons

Guns used in missions or assassination attempts are consumed. All weapons can be sold for **75% of the original value**.

| Real World Inspiration | In-Game Name | Price | Attack Multiplier | Rank Required | Usage Cost | Cartridge |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| **Beretta 92FS** | B-92 | $10,000 | 1x | 1 | $2,000 | 9mm |
| **Glock 19** | G19-C | $20,000 | 1.2x | 1 | $4,000 | 9mm |
| **AK-47** | Krasny 47 | $40,000 | 1.5x | 1 | $8,000 | .50 AE |
| **AR-15** | Apex-15 | $50,000 | 2x | 12 | $10,000 | 7.62mm |
| **Steyr AUG** | A1 Augmented | $200,000 | 2.5x | 12 | $40,000 | 5.56mm |
| **Dragunov SVD** | Markov SVM | $400,000 | 3x | 12 | $80,000 | 7.62mm |
| **VSS** | Whisper | $650,000 | 3.2x | 12 | $130,000 | 5.56mm |
| **CheyTac Intervention M200** | Intervention | $1,000,000 | 3.5x | 12 | $200,000 | 5.56mm |

---

## Cars

All cars can be sold for **75% of the original value**.

| Real World Inspiration | In-Game Name | Price | Driving Points | Defense Points | Attack Points |
| :--- | :--- | :---: | :---: | :---: | :---: |
| **Honda Civic** | Apex Type-C200 | $20,000 | 1x | 1x | 1x |
| **Jeep Wrangler Unlimited Rubicon** | Overlander | $50,000 | 1x | 2x | 1x |
| **BMW M4 GTS** | Falken GTS | $100,000 | 1.5x | 1.5x | 1.5x |
| **Toyota Land Cruiser 300 (Armored)** | Vanguard | $250,000 | 1.2x | 3x | 1.2x |
| **Aston Martin Valkyrie** | Banshee | $400,000 | 2x | 1.7x | 1.7x |
| **Rolls-Royce Phantom (Armored)** | Imperium-R Armored | $1,000,000 | 3x | 1.8x | 2.5x |
| **Bugatti La Voiture Noire** | Bordeaux V16 | $3,500,000 | 1.4x | 4x | 1.3x |

---

## Houses

All houses can be sold for **75% of the original value**.

| House | Price | Defense | Garage Capacity | Maintenance Cost / Day |
| :--- | :---: | :---: | :---: | :---: |
| **Studio Apartment** | $100,000 | 1.5x | 1 | $1,000 |
| **Luxury Condo** | $1,000,000 | 3x | 2 | $10,000 |
| **Mansion Estate** | $20,000,000 | 5x | 4 | $100,000 |

---

## Traveling

Elites can travel to 12 different cities:
1. New York
2. Mexico City
3. Moscow
4. Rome
5. Abu Dhabi
6. Hong Kong
7. Tokyo
8. Rio de Janeiro
9. London
10. Paris
11. Jakarta
12. Sydney

### Airplanes

| Real World Inspiration | In-Game Name | Price | Speed Multiplier | Price per km | Cooldown |
| :--- | :--- | :---: | :---: | :---: | :---: |
| - | Commercial Flight | $0 | 1x | $1 | 3h |
| **Embraer Phenom 300, Learjet 75** | Corvus | $7,500,000 | 1.5x | $2 | 1h 45m |
| **Gulfstream G650ER** | Mach IV | $30,000,000 | 2x | $5 | 45m |
| **Concorde** | Sentinelle | $200,000,000 | 5x | $20 | 15m |
