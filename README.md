# Points
A Discord bot for managing user points.

### Overview
Points are awarded to users for activity in the guild/server. Sending messages, being in voice channels, and interactions with the bot (/coinflip)

## Commands
### /ping
Responds to show the bot is online

### /balance `user`
Displays a user's current balance. Tags the user. 
`user` parameter is optional to choose which user's balance to display

### /leaderboard
Displays the top 3 users and their points in the current guild

### /coinflip `points`
Bets the amount of `points` on a 50/50 chance. winning adds `points` to the user's balance, losing subracts `points`

### /blackjack `points`
Bets the amount of points on a hand of blackjack. Multiple users can join the hand before cards are dealt.

### /baccarat `player`, `banker`, `tie`
Bets the amount of points on a round of baccarat. All bets are optional to allow maximum flexibility in betting style.