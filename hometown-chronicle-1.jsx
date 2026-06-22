import { Fragment, useEffect, useMemo, useState } from "react";
import { supabase } from "./src/utils/supabase.js";

const PUBLIC_SIGNALS = [
  { scope: "Global economy", region: "Worldwide", title: "Capital is repricing around slower growth and higher uncertainty", summary: "Operators are balancing tighter financing conditions against uneven demand, making cash discipline and flexible investment timing more valuable.", impact: 88, horizon: "0-18 months" },
  { scope: "Technology", region: "North America / Asia", title: "AI infrastructure is becoming an energy and industrial story", summary: "Compute expansion is pushing demand beyond chips and software into power generation, grid equipment, cooling, construction, and specialized labor.", impact: 94, horizon: "1-5 years" },
  { scope: "Energy", region: "Worldwide", title: "Grid capacity is emerging as a constraint on digital expansion", summary: "Power availability, interconnection queues, and equipment lead times increasingly shape where energy-intensive projects can operate.", impact: 91, horizon: "2-7 years" },
  { scope: "Trade", region: "Global corridors", title: "Supply chains continue to favor resilience over pure efficiency", summary: "Companies are diversifying suppliers, holding more strategic inventory, and placing greater value on reliable transport and regional production capacity.", impact: 83, horizon: "1-4 years" },
  { scope: "Resources", region: "Americas / Indo-Pacific", title: "Critical minerals are moving closer to national strategy", summary: "Permitting, processing capacity, recycling, and secure access to industrial inputs are becoming competitive advantages for regions and firms.", impact: 86, horizon: "3-10 years" },
  { scope: "Demographics", region: "Advanced economies", title: "Aging populations are reshaping labor and essential services", summary: "Healthcare, housing, mobility, automation, and workforce availability will be influenced by a growing share of older residents.", impact: 89, horizon: "5-15 years" }
];

/* ----------------------------------------------------------------------------
   News outlet — public editorial content (front-end only; no backend, no RLS,
   no entitlement changes). Structured so additional articles can be added by
   appending objects here, or migrated to a CMS/database later.
---------------------------------------------------------------------------- */

const FEATURE_ARTICLE = {
  slug: "last-empire-of-oil",
  status: "published",
  category: "Investigation",
  kicker: "Original investigation",
  title: "The Last Empire of Oil",
  dek: "How Donald Trump's gamble to reimpose the petrodollar could reshape — or fracture — the world economy.",
  cardDek: "The secret 1974 bargain that made the dollar the oxygen of global commerce — and why it is now under its most serious threat in fifty years.",
  standfirst: "An original investigation for Chronicle Future Magazine · June 2026",
  byline: "Chronicle Future",
  dateLabel: "June 2026",
  readingTime: "18 min read",
  epigraph: {
    quote: "The world saves in dollars in large part because it pays in dollars.",
    source: "Deutsche Bank, March 2026"
  },
  lead: "There is a deal most Americans have never heard of that has quietly shaped the price of everything they buy, the interest rate on every mortgage they've ever signed, and the foreign policy of every president since Richard Nixon.",
  sections: [
    {
      id: "intro",
      figures: ["key-numbers"],
      paragraphs: [
        `There is a deal most Americans have never heard of that has quietly shaped the price of everything they buy, the interest rate on every mortgage they've ever signed, and the foreign policy of every president since Richard Nixon. It was brokered not in public, not by treaty, not with the fanfare of a G7 summit, but in a private arrangement between Henry Kissinger and the Saudi royal family in the summer of 1974. It was never written into law. It was never ratified. But for fifty years, it functioned as the invisible skeleton of the global financial order.`,
        `The deal was simple, and elegant in its ruthlessness: Saudi Arabia would price its oil exclusively in US dollars, and invest its surplus revenues in US Treasury bonds. In exchange, Washington would guarantee the security of the kingdom. Because oil is the foundational input of every modern economy — you cannot make fertiliser, plastics, pharmaceuticals, or microchip coolant without it — every country on Earth that needed oil needed dollars first. And because every oil-producing nation followed Saudi Arabia's lead, the dollar became, effectively, the oxygen of global commerce.`,
        `It was what the late French finance minister Valéry Giscard d'Estaing once famously called America's exorbitant privilege. And for half a century, the United States used it to borrow cheaply, run persistent deficits, fund its military, and project power in ways no other nation could afford to replicate.`,
        `Now, in the spring of 2026, that privilege is under the most serious threat in its history. And the man who set the most dramatic recent events in motion is the same man who insists he is trying to save it: Donald J. Trump.`
      ]
    },
    {
      id: "part-one",
      figures: ["petrodollar-loop"],
      eyebrow: "Part One",
      heading: "The Architecture of American Power",
      pullQuote: "Remove that demand, and the entire edifice begins to wobble.",
      paragraphs: [
        `To understand what is at stake, you have to understand what the petrodollar actually does — and why its collapse would be so catastrophic for the United States.`,
        `When an economy runs a persistent trade deficit, as the US has done for decades, it must continuously attract foreign capital to balance the books. Under any other currency regime, this would eventually force discipline: a weaker currency, higher interest rates, reduced borrowing. But the dollar's status as the world's reserve currency exempts Washington from this ordinary arithmetic. Because global trade is denominated in dollars, and because oil — the most widely traded commodity in the world — is priced in dollars, there is always a structural demand for the currency. Countries must hold dollar reserves simply to participate in the modern economy.`,
        `This creates a circular, self-reinforcing mechanism. Oil exporters earn dollars. They invest those dollars in US Treasury bonds, which are the world's most liquid safe-haven asset. This demand for Treasuries keeps US borrowing costs lower than they would otherwise be. Those low borrowing costs allow Washington to fund its military and social programmes without facing the fiscal constraints that discipline every other major economy. That military, in turn, protects the Gulf states that price their oil in dollars, which sustains the demand for those dollars, which funds that military. Around and around it goes.`,
        `The numbers tell the story starkly. As of early 2026, the United States carries a national debt of $39 trillion — a figure that crossed that threshold in March of this year, weeks into the US military engagement with Iran. Each percentage point rise in the interest rate on that debt costs the Treasury hundreds of billions of dollars annually. The only reason this does not trigger an immediate fiscal crisis is that foreign demand for dollar-denominated assets keeps those rates suppressed. Remove that demand, and the entire edifice begins to wobble.`,
        `This is what Trump's advisers understand. And it is what drives — beneath the tariff wars, the territorial rhetoric, and the spectacular diplomatic ruptures — a coherent, if brutally blunt, strategy to ensure that no country feels comfortable moving away from the dollar.`
      ]
    },
    {
      id: "part-two",
      eyebrow: "Part Two",
      heading: "The Trump Strategy — Coercion as Currency Policy",
      paragraphs: [
        `Trump has never been a subtle architect of geopolitical theory. But those around him — and analysts parsing the patterns in his second-term foreign policy — see something that looks less like chaos and more like a coherent doctrine: the restoration of what political economist Peter Gowan once called the Dollar-Wall Street Regime.`,
        `The strategy has several interlocking components.`
      ],
      points: [
        { lead: "Tariffs as dollar weaponry.", text: `When Trump announced sweeping tariff increases on April 2, 2025 — a day he labelled "Liberation Day" — most analysts focused on the trade war dimension. But the logic also operated at a currency level: by imposing tariffs, the administration sought to strengthen the dollar (a stronger dollar makes imports cheaper, partially offsetting tariff costs) and to force surplus countries to negotiate on US terms, including financial terms. Tariff threats have also been deployed explicitly against any nation contemplating a move away from the dollar. In early 2025, Trump threatened 100% tariffs on BRICS nations pursuing de-dollarisation efforts. "BRICS is dead," he declared in February of that year — a statement that proved premature, but that illustrated the willingness to use economic coercion in service of currency dominance.` },
        { lead: "Energy dominance as geopolitical leverage.", text: `From his first term, Trump has insisted on what he calls "American energy dominance" — maximum fossil fuel production, minimal climate regulation, and the active promotion of US liquefied natural gas exports. This is not only industrial policy. It is petrodollar policy. Every long-term LNG contract signed between a US producer and an Asian buyer is a contract denominated in dollars. Every barrel of American shale oil on the global market reinforces the dollar's centrality to energy trade. In this framing, abandoning fossil fuels is not just bad for the economy — it is geopolitical surrender.` },
        { lead: "Resource acquisition as security strategy.", text: `The administration's aggressive posture toward Venezuela, its repeated interest in acquiring Greenland, and its minerals-for-security deals in various developing nations all follow a similar logic: securing the physical commodity base that underpins both fossil fuel economies and the emerging green technology supply chain. When Trump said of Venezuelan oil seized by US forces in January 2026, "Well, we keep it, I guess," he articulated the bluntest possible version of this strategy. Control the resources, control the currency that prices them.` },
        { lead: "Alliance pressure and NATO leverage.", text: `By repeatedly questioning US commitments to NATO and demanding that European allies pay more for their own defence, Trump has sought to reframe the post-war security bargain. The implicit logic: American military protection is not free, and countries that benefit from the US security umbrella should pay for it in kind — including through continued participation in dollar-denominated financial systems.` },
        { lead: "Intimidation of the Federal Reserve.", text: `Trump's repeated attacks on Federal Reserve Chairman Jerome Powell, and his reported attempts to remove or undermine him before his term ended, have been widely condemned as an assault on institutional independence. But they also serve a more specific purpose in the currency strategy: a Fed that accommodates executive pressure is a Fed that can be directed to maintain policies that serve the dollar's reserve status over inflation control, if necessary.` }
      ]
    },
    {
      id: "part-three",
      figures: ["reserve-decline"],
      eyebrow: "Part Three",
      heading: "The Cracks in the Foundation",
      pullQuote: "The tools Trump is using to defend dollar dominance may be the very things eroding it.",
      paragraphs: [
        `Here is where the strategy encounters a paradox so profound it threatens to undo itself: the tools Trump is using to defend dollar dominance may be the very things eroding it.`,
        `The most dramatic illustration came on and after April 2, 2025. When Liberation Day tariffs were announced, financial markets did something they had never done in living memory during a period of acute uncertainty. The dollar fell. Not slightly — sharply. And it fell even as the VIX index, Wall Street's fear gauge, spiked upward. This violated one of the most reliable rules of modern finance: in a crisis, investors flee to the dollar. The dollar is supposed to be the safe haven. Instead, investors appeared to be fleeing from the dollar — and from US Treasury bonds — simultaneously.`,
        `By the end of 2025, the dollar index, which tracks the greenback against a basket of major currencies, had fallen nearly 10%. This was the worst annual performance for the dollar in over fifty years. Central banks began diversifying reserves at an accelerating pace. The share of the dollar in global foreign exchange reserves, which had already declined from 72% in 2001, fell to approximately 56.9% by the third quarter of 2025 — its lowest level since 1995, according to IMF data.`,
        `The reasons were not mysterious. Trump's tariff regime, the exploding national debt, and rising inflation expectations all fed a "Sell America" trade among global investors. More damaging still was the question of institutional credibility. For the dollar's reserve status to hold, foreign investors must trust that US institutions — the Fed, the courts, the Treasury — will behave predictably and in accordance with the rule of law. Trump's attacks on those institutions, his firings of officials he deemed insufficiently loyal, and what a peer-reviewed study in the journal International Organization described as "erratic" and "capricious" policies combined to raise a question that investors are never comfortable asking: is the United States still a safe bet?`,
        `As measured by credit default swaps — essentially insurance contracts against a country defaulting on its debt — the United States had, by May 2025, the highest perceived default risk of any G7 nation. This was a staggering reversal. In 2021, it had the lowest.`,
        `The deeper contradiction runs still further. Trump's energy dominance strategy is premised on the continued centrality of fossil fuels to the global economy. But the petrodollar system's long-term viability faces a challenge that no amount of gunboat diplomacy can resolve: the accelerating global transition away from oil. The Gulf states themselves have long-term plans to diversify their economies away from petroleum revenues and into green technologies and sovereign wealth funds. As renewable energy becomes cheaper than oil across more of the global South, the structural demand for petrodollars — countries needing dollars to buy oil — will naturally diminish. The Trump administration's response to this reality, doubling down on arms sales and fossil fuel infrastructure, has been characterised by some economists as a "long-term strategic failure" that fundamentally misreads the direction of history.`
      ]
    },
    {
      id: "part-four",
      eyebrow: "Part Four",
      heading: "The Saudi Pivot and the Petrodollar's Quiet Death Notice",
      paragraphs: [
        `Buried in the diplomatic calendar of June 2024 — largely overlooked at the time — was a notice that the original 1974 petrodollar agreement between the United States and Saudi Arabia had lapsed and would not be formally renewed. Riyadh declined to recommit to pricing its oil exclusively in dollars. The deal that Henry Kissinger had spent years constructing, the foundational bargain of the entire system, simply expired without fanfare.`,
        `Saudi Arabia has not, it should be emphasised, stopped trading in dollars. The Kingdom still held $149.5 billion in US Treasury securities as of December 2025, and actually increased those holdings by $12 billion over the course of that year. But the non-renewal of the formal agreement was a signal. The Saudis have simultaneously joined the mBridge project — a central bank digital currency initiative led by China specifically designed to create an alternative to dollar-payment infrastructure. They are building hedges.`,
        `The reasons are not difficult to understand. A 2016 piece of US legislation exposed Saudi sovereign assets to potential seizure through American courts. The precedent was noted not only in Riyadh but in every capital that holds dollar-denominated reserves. If the United States can freeze or seize Russian dollar assets as a sanction, and if it can pursue Saudi assets through domestic courts, then holding dollars comes with a form of political risk that was never part of the original bargain. This "weaponisation" of the dollar — the use of dollar-system access as a geopolitical weapon — has accelerated precisely as the Trump administration leans more heavily on it.`,
        `It is a trap of the system's own making. The more aggressively the US deploys dollar dominance as a coercive tool, the more urgently its targets seek alternatives. And the more they build those alternatives, the more the dominance they were designed to coerce begins to hollow out.`
      ]
    },
    {
      id: "part-five",
      figures: ["hormuz-share"],
      eyebrow: "Part Five",
      heading: "The Strait of Hormuz and the Iran War — The Petrodollar's Crucible",
      pullQuote: "A key catalyst for erosion in petrodollar dominance, and the beginnings of the petroyuan.",
      paragraphs: [
        `No single event has tested the petrodollar's structural resilience more acutely than the military conflict with Iran that began in February 2026. The Strait of Hormuz — the narrow chokepoint through which roughly one-fifth of the world's oil supply passes — became the most consequential stretch of water in global finance.`,
        `Iran's ability to threaten, and periodically disrupt, shipping through the Strait has done something peculiar to the dollar. In the short term, conflict has supported the dollar, as investors historically seek safe-haven assets during Middle East crises, and as a higher oil price — priced in dollars — temporarily increases global demand for the currency. The dollar strengthened against all major currencies after hostilities commenced, and moved in unusual tandem with the oil price.`,
        `But the longer-term analysis tells a more complicated story. Deutsche Bank analysts noted in late March 2026 that the Iran conflict may prove to be "a key catalyst for erosion in petrodollar dominance, and the beginnings of the petroyuan." The mechanism they identified was precise: if Iran can credibly threaten the Strait, and if China can offer Gulf states passage guarantees in exchange for oil payments in yuan, then a structural incentive emerges for regional producers to price at least some of their oil in China's currency. Reports that Iran was, in some instances, demanding yuan payments for safe passage through its controlled waters were described by Deutsche Bank analysts as something that "should be closely followed."`,
        `The US-Israel military campaign against Iran has, meanwhile, drawn those two regional adversaries — Iran and China — into a tighter strategic embrace. German economists warned in April 2026 that continued US and Israeli military pressure would deepen Iran's ties to China, bolstering the yuan's international role at the dollar's expense. The very intervention designed to protect the petrodollar system's physical infrastructure — secure Gulf shipping lanes — may be simultaneously accelerating the political and financial conditions for that system's erosion.`,
        `There is a brutal irony at the heart of this. The historical logic of US military engagement in the Middle East has always been, at least in part, about maintaining the conditions under which oil continues to be priced in dollars. Iraq's Saddam Hussein and Libya's Muammar Gaddafi both experimented with accepting non-dollar currencies for oil in the years before their governments were overthrown. The connection is rarely stated in official policy documents. But it hangs in the air of every serious strategic discussion about the region. Now, Trump's Iran campaign risks producing the very outcome it was designed to prevent: a legitimised alternative architecture for oil-for-currency transactions that bypasses the dollar entirely.`
      ]
    },
    {
      id: "part-six",
      figures: ["gold-buying", "treasury-holdings", "fx-dominance"],
      eyebrow: "Part Six",
      heading: "The BRICS Challenge — Ambition Meets Reality",
      paragraphs: [
        `Against this backdrop of dollar vulnerability, the BRICS bloc — now expanded to eleven full members including Iran, Saudi Arabia, the UAE, Indonesia, Egypt, and Ethiopia, representing over 45% of the world's population and more than 35% of global GDP by purchasing power parity — has accelerated its push to build alternative financial infrastructure. Understanding what they have actually achieved, versus what has been hyped, requires separating signal from noise.`,
        `The signal is real. Russia and China now settle approximately 90% of their bilateral trade in rubles and yuan, bypassing dollar intermediaries entirely. Russia developed its own SWIFT alternative (SPFS) and its Mir payment network after Western sanctions froze it out of dollar channels. China's Cross-Border Interbank Payment System (CIPS) processed the equivalent of $245 trillion in yuan-denominated transactions in 2025 — genuine, operational infrastructure providing a settlement alternative to dollar-denominated SWIFT channels. In October 2025, BRICS researchers launched a pilot "Unit" — a digital trade settlement instrument backed 40% by gold and 60% by a basket of BRICS currencies — designed specifically to reduce dollar dependency in cross-border transactions. Intra-BRICS trade hit $500 billion in 2025, with certain corridors seeing over 90% of transactions conducted without dollar intermediation.`,
        `Perhaps most consequentially, central banks globally have been accumulating gold at a historic pace. The World Gold Council reported that central banks purchased over 1,000 tonnes of gold in each of the three consecutive years from 2022 to 2024 — more than double the average annual purchase rate from 2010 to 2021. Russia and China have both dramatically increased their gold reserves while reducing their exposure to US Treasuries. Russia liquidated virtually its entire $96 billion US Treasury holding between 2013 and 2025. China nearly halved its holdings from $1.32 trillion to $756 billion over the same period, while doubling its gold reserves.`,
        `The noise, however, is also significant. The grand unified BRICS currency that occupied so many headlines in 2024 and 2025 has not materialised, and experts do not expect it before 2028 at the earliest. The July 2025 BRICS summit in Rio de Janeiro produced a 126-point communiqué that did not mention de-dollarisation directly — a tactical step back under pressure from Trump's tariff threats. Brazil's President Lula, previously one of the loudest advocates for a shared BRICS currency, quietly removed the proposal from the agenda after Liberation Day. India, the new BRICS chair for 2026, has been explicit: its External Affairs Minister stated flatly that India has no policy to replace the dollar, and that the dollar remains the foundation of global economic stability.`,
        `The BIS 2025 Triennial Survey, the most comprehensive measure of global currency use, found the dollar on one side of 89.2% of all foreign exchange transactions — actually an increase from 88.4% in 2022. The yuan's share, while growing, remains at 8.5% of FX transactions. China's capital controls, which prevent the free convertibility of the renminbi, remain the fundamental structural barrier to any genuine petroyuan competing with the petrodollar. You cannot replace the world's reserve currency with one that investors cannot freely move in and out of.`,
        `What is emerging is not a replacement for the dollar system, but a series of parallel tracks running alongside it — bilateral arrangements, commodity-backed instruments, digital payment corridors — that reduce some nations' dependence on the dollar without eliminating it. "Gradual erosion" rather than "sudden collapse" is the consensus view among serious economists. The dollar is weakened but not replaced; challenged but not dethroned.`
      ]
    },
    {
      id: "part-seven",
      eyebrow: "Part Seven",
      heading: "Scenario One — If America Wins",
      paragraphs: [
        `What does success look like for Trump's strategy? In the scenario where the US emerges from the Iran conflict having neutralised Iran's Hormuz threat, restored Gulf oil flows through dollar-denominated channels, and reasserted its position as the indispensable guarantor of global energy security, the petrodollar gets a reprieve.`,
        `In this scenario, BRICS fractures under tariff pressure and internal contradictions. India continues to prioritise its bilateral relationship with Washington. Saudi Arabia, reassured by US military protection, maintains its practical reliance on dollar infrastructure even without the formal 1974 agreement. China's capital controls continue to prevent the yuan from achieving reserve currency status. The BRICS Unit remains a niche settlement instrument used for a fraction of intra-bloc trade, never scaling to challenge the dollar's centrality.`,
        `In this scenario, Trump's approach — maximalist coercion, resource control, military projection — is vindicated as effective, if brutal, dollar management. The United States continues to borrow cheaply, run its deficits, and fund its priorities without facing the fiscal discipline that would otherwise be demanded.`,
        `But even this success scenario carries significant long-term costs. The dollar's position has been bought, in this telling, through intimidation and confrontation rather than through the institutional trust and rule-of-law credibility that historically underpinned it. Allies who have been alternately threatened and abandoned — Canada's Prime Minister Mark Carney spoke of "a rupture in the world order" following Trump's Greenland and Venezuela moves — may maintain dollar exposure for now, while quietly accelerating their diversification plans. The weaponisation of dollar-system access means that every nation now rationally considers what it would look like to have alternatives available. Even nations that choose not to use those alternatives have stronger incentives to build them.`,
        `There is also the energy transition wildcard. Even a triumphant petrodollar faces a structural horizon question: in a world moving away from fossil fuels, what does oil-price-denominated dollar demand eventually become? The Gulf states are already investing massively in solar, green hydrogen, and sovereign wealth funds oriented toward non-oil assets. The petrodollar system that a Trump victory shores up today may still be living on borrowed time in a decade.`
      ]
    },
    {
      id: "part-eight",
      eyebrow: "Part Eight",
      heading: "Scenario Two — If America Fails",
      paragraphs: [
        `The failure scenario is harder to dismiss than it might have seemed two years ago. In this scenario, the Iran conflict drags on without resolution, with Iran maintaining enough leverage over Hormuz to sustain a credible threat. The cost of the conflict, added to an already spiralling national debt, pushes the United States' fiscal trajectory into territory that begins to genuinely alarm bond markets. Already, by March 2026, Moody's — the last of the three major credit rating agencies to act — had downgraded US sovereign debt. Interest costs become the fastest-growing item in the federal budget.`,
        `Foreign investors, watching institutional credibility erode — through Fed independence attacks, through court-packing concerns, through the politicisation of the regulatory state — continue to demand a premium for holding dollar assets that they did not previously require. The dollar continues to weaken, not dramatically but persistently, as the "Sell America" trade that dominated 2025 resumes after any Iran ceasefire.`,
        `In this scenario, BRICS alternatives gain genuine traction. Not because any single alternative is ready to replace the dollar, but because enough nations find it rational to route enough of their trade through non-dollar channels that the dollar's share of global transactions falls below a psychological threshold. The dollar goes from being the automatic default to one among several options depending on the trading relationship.`,
        `The consequences for ordinary Americans would be severe and diffuse. Higher interest rates on the national debt would crowd out public investment in infrastructure, healthcare, and education. The "exorbitant privilege" that allowed the United States to borrow at below-market rates would diminish, meaning Americans would pay more for mortgages, car loans, and credit cards. Import prices would rise as the dollar's purchasing power abroad declined. The United States would no longer be able to sanction adversaries as effectively, since dollar-system exclusion becomes less punishing if dollar-system alternatives are accessible.`,
        `It would not be a sudden crash. Economists are unanimous that the dollar has no realistic near-term replacement, and that any transition away from dollar dominance would unfold over decades, not years. China cannot step into the vacuum while maintaining capital controls. The euro lacks the scale and geopolitical unity required. The BRICS Unit is a settlement instrument, not a full-spectrum reserve currency. But a dollar that is weakened, that no longer commands the automatic deference it once did, would represent a fundamental shift in the American standard of living — a closing of the gap between what the United States can afford and what any other large economy in its position would have to pay.`
      ]
    },
    {
      id: "part-nine",
      eyebrow: "Part Nine",
      heading: "The Third Path — Energy Transition as Wildcard",
      paragraphs: [
        `There is a third scenario that neither Trump's advisers nor most mainstream financial analysts have fully reckoned with, and it may ultimately be the most consequential: the energy transition itself makes the entire petrodollar debate moot.`,
        `The petrodollar system rests on a simple physical fact: global commerce requires oil, and oil is priced in dollars. Remove that fact — or substantially diminish it — and the structural demand for dollars that underpins the system evaporates regardless of what Trump or BRICS or the Saudi royal family decide to do.`,
        `Renewable energy prices have fallen faster than virtually every projection predicted. Solar and wind are now cheaper than fossil fuels across most of the world. Electric vehicles are displacing internal combustion engines at an accelerating rate. Green hydrogen — produced by splitting water molecules using renewable electricity — is beginning to challenge the fossil fuel dominance of industrial processes. As these transitions compound, the fraction of global economic activity that requires oil, and therefore dollars, steadily shrinks.`,
        `The Gulf states are not naive about this. Their massive sovereign wealth fund diversification — into technology, real estate, financial services, and green energy itself — reflects an acute awareness that their oil-revenue model has a finite horizon. Saudi Arabia's Vision 2030 is, at its core, a plan for the post-oil economy. The petrodollar system that Trump is fighting so hard to defend may be structurally undermined not by BRICS currencies or Iranian missiles, but by the solar panel and the lithium battery.`,
        `This creates a profound strategic irony. Trump's insistence on fossil fuel expansion — presented as a defence of the petrodollar — may actually be prolonging the United States' dependence on the very system that is most vulnerable to long-term disruption. A US that had led the green energy transition would be positioned to become the provider of the next generation's energy security infrastructure, potentially denominating a different but equally central set of commodity contracts in dollars. Instead, the current strategy bets everything on a system whose physical foundation is eroding under the pressure of technological change.`
      ]
    },
    {
      id: "epilogue",
      eyebrow: "Epilogue",
      heading: "The Weight of the Exorbitant Privilege",
      pullQuote: "The petrodollar was always more than an oil deal. It was a promise.",
      paragraphs: [
        `In the spring of 2026, as US aircraft carriers manoeuvre through the Persian Gulf and BRICS finance ministers convene to finalise the Unit pilot programme and the national debt ticks past $39 trillion, the fundamental question hanging over global finance is whether the architecture Henry Kissinger built in 1974 can survive the strains of the 2020s.`,
        `The honest answer is: probably, for now — but in diminished form, and on borrowed time. The dollar remains, by overwhelming metrics, the world's dominant reserve currency. No alternative comes close to matching the liquidity, institutional depth, and sheer transactional scale of the dollar system. The yuan faces structural barriers that require political decisions China has shown no willingness to make. The BRICS Unit is a genuine development but not yet a threat to dollar hegemony.`,
        `What has changed is not the dollar's position today, but the direction of travel, and the confidence with which that travel can be accelerated. A decade ago, de-dollarisation was an aspiration discussed mostly by fringe economists and geopolitical revanchists. Today it is a line item in the strategic plans of central banks representing billions of people, funded by gold reserves accumulated at historically unprecedented rates, implemented through genuine payment infrastructure that routes real transactions around the dollar system every day.`,
        `Trump's strategy assumes that American power, aggressively deployed, can freeze that trajectory. The counter-argument — made by everyone from Deutsche Bank economists to Cambridge political scientists to economists at the Peterson Institute — is that aggressive deployment of American power is precisely what is accelerating it. Every sanction that demonstrates the dollar's weaponisability gives another nation another reason to build an exit. Every institutional norm shattered in the name of restoring American dominance removes another brick from the foundation on which that dominance actually rests.`,
        `The petrodollar was always more than an oil deal. It was a promise — implicit, unwritten, but deeply held — that the United States would be a predictable custodian of the global financial system, that its institutions would hold, that the rule of law would constrain even the most powerful. That promise, extended by a secret handshake in 1974, was the true engine of fifty years of American economic supremacy.`,
        `The question for the next decade is not whether a new currency will replace the dollar. It almost certainly will not, at least not in any of our lifetimes. The question is whether the United States can repair enough of what has been damaged — in alliance relationships, in institutional credibility, in the global trust that makes safe-haven status self-fulfilling — to maintain the substance of the privilege even after some of its form has eroded.`,
        `That is not a question any tariff can answer, and no missile can resolve it. It is, in the end, a question about what kind of country America chooses to be. And the world — having watched the events of the past eighteen months with a mixture of alarm and calculation — is waiting, and planning, and quietly building its alternatives, just in case the answer turns out to be the wrong one.`
      ]
    }
  ],
  sourceNote: `Chronicle Future Magazine is an independent publication. The views expressed in this exposé represent an analysis of publicly available economic, financial, and geopolitical evidence. This article draws on reporting from Fortune, the Centre for Economic Policy Research, Cambridge's International Organization journal, Deutsche Bank research, IMF COFER data, Green Central Banking, and multiple institutional analyses published between 2025 and 2026.`
};

const UPCOMING_ARTICLES = [
  { slug: "grid-cant-keep-up", status: "upcoming", category: "Energy", title: "The Grid Can't Keep Up", cardDek: "Why power capacity — not chips — is becoming the real constraint on the AI build-out.", dateLabel: "Forthcoming" },
  { slug: "mineral-nationalism", status: "upcoming", category: "Resources", title: "Mineral Nationalism", cardDek: "Permitting, processing, and the quiet race to control the inputs of the next economy.", dateLabel: "Forthcoming" },
  { slug: "aging-balance-sheet", status: "upcoming", category: "Demographics", title: "The Aging Balance Sheet", cardDek: "How shifting demographics will reprice labor, housing, and the essential services that hold a region together.", dateLabel: "Forthcoming" },
  { slug: "resilience-premium", status: "upcoming", category: "Trade", title: "The Resilience Premium", cardDek: "Supply chains are still choosing reliability over pure efficiency. The question is who pays for it.", dateLabel: "Forthcoming" }
];

const NEWS_ARTICLES = { [FEATURE_ARTICLE.slug]: FEATURE_ARTICLE };

const SIGNAL_GROUPS = ["Local", "State", "National", "Global", "Technology", "Commodity"];
const BRIEF_FIELDS = {
  Local: "local_signals",
  State: "state_signals",
  National: "national_signals",
  Global: "global_signals",
  Technology: "technology_watch",
  Commodity: "commodity_watch"
};
const AUTH_REDIRECT_URL = window.location.origin;

const displayDate = (value) => new Date(value || Date.now()).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
const longDate = (value) => new Date(value || Date.now()).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" });

async function loadDashboardData(userId) {
  const [{ data: locations, error: locationError }, { data: briefs, error: briefError }, { data: issues, error: issueError }, { data: entitlement, error: entitlementError }] = await Promise.all([
    supabase.from("cf_locations").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
    supabase.from("cf_briefs").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
    supabase.from("cf_magazine_issues").select("*").order("created_at", { ascending: false }),
    supabase.from("cf_entitlements").select("*").eq("user_id", userId).maybeSingle()
  ]);
  if (locationError) throw locationError;
  if (briefError) throw briefError;
  if (issueError) throw issueError;
  if (entitlementError) throw entitlementError;
  return { locations: locations || [], briefs: briefs || [], issues: issues || [], entitlement };
}

async function createLocation(form, userId) {
  const payload = { city: form.city.trim(), state: form.state.trim().toUpperCase(), zip: form.zip.trim(), user_id: userId };
  const { data, error } = await supabase.from("cf_locations").insert(payload).select("*").single();
  if (error) throw error;
  return data;
}

async function loadBrief(briefId) {
  const { data: brief, error } = await supabase.from("cf_briefs").select("*").eq("id", briefId).single();
  if (error) throw error;
  const [signals, scores, opportunities, risks, swots] = await Promise.all([
    supabase.from("cf_signals").select("*").eq("brief_id", briefId),
    supabase.from("cf_signal_scores").select("*").eq("brief_id", briefId),
    supabase.from("cf_opportunities").select("*").eq("brief_id", briefId),
    supabase.from("cf_risks").select("*").eq("brief_id", briefId),
    supabase.from("cf_swots").select("*").eq("brief_id", briefId).limit(1)
  ]);
  const requestError = [signals, scores, opportunities, risks, swots].find((result) => result.error)?.error;
  if (requestError) throw requestError;
  const scoresBySignal = (scores.data || []).reduce((map, item) => ({ ...map, [item.signal_id]: item }), {});
  return {
    ...brief,
    signals: (signals.data || []).map((item) => ({ ...item, score: scoresBySignal[item.id] })),
    opportunities: opportunities.data || [],
    risks: risks.data || [],
    swot: swots.data?.[0] || {}
  };
}

async function loadMagazine(issueId) {
  const [issueResult, articleResult] = await Promise.all([
    supabase.from("cf_magazine_issues").select("*").eq("id", issueId).single(),
    supabase.from("cf_magazine_articles").select("*").eq("issue_id", issueId).order("sort_order")
  ]);
  if (issueResult.error) throw issueResult.error;
  if (articleResult.error) throw articleResult.error;
  return { issue: issueResult.data, articles: articleResult.data || [] };
}

async function saveMagazine(issue, articles) {
  const updatedAt = new Date().toISOString();
  const issueResult = await supabase.from("cf_magazine_issues").update({
    title: issue.title,
    subtitle: issue.subtitle,
    dek: issue.dek,
    editor_note: issue.editor_note,
    status: issue.status,
    updated_at: updatedAt
  }).eq("id", issue.id).select("id").single();
  if (issueResult.error) throw issueResult.error;
  const articleResults = await Promise.all(articles.map((article) => supabase.from("cf_magazine_articles").update({
    section: article.section,
    headline: article.headline,
    subheadline: article.subheadline,
    body: article.body,
    pull_quote: article.pull_quote,
    source_note: article.source_note,
    status: article.status,
    updated_at: updatedAt
  }).eq("id", article.id).select("id").single()));
  const articleError = articleResults.find((result) => result.error)?.error;
  if (articleError) throw articleError;
}

async function authorizedFetch(url, options = {}) {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("Your session has expired. Sign in again.");
  return fetch(url, {
    ...options,
    headers: { ...options.headers, Authorization: `Bearer ${token}` }
  });
}

/* ----------------------------------------------------------------------------
   Shared data-visualization primitives (bespoke, print-safe inline SVG / CSS)
---------------------------------------------------------------------------- */

const toScore = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  // Accept either a 0-10 or a 0-100 scale and normalize to a 0-100 percentage.
  const scaled = n <= 10 ? n * 10 : n;
  return Math.max(0, Math.min(100, scaled));
};

const horizonToYears = (text) => {
  const value = String(text || "").toLowerCase();
  const numbers = value.match(/\d+(?:\.\d+)?/g);
  if (!numbers) return null;
  const upper = Number(numbers[numbers.length - 1]);
  if (!Number.isFinite(upper)) return null;
  if (value.includes("month") || value.includes("quarter")) return upper / 12;
  return upper;
};

function Meter({ label, value, suffix = "", tone = "green" }) {
  const pct = toScore(value);
  if (pct === null) return null;
  return (
    <div className={`meter meter-${tone}`}>
      <span className="meter-label">{label}</span>
      <span className="meter-track"><span className="meter-fill" style={{ width: `${pct}%` }} /></span>
      <span className="meter-value">{value}{suffix}</span>
    </div>
  );
}

function KeyNumber({ value, label, note }) {
  return (
    <div className="key-number">
      <strong>{value}</strong>
      <span>{label}</span>
      {note ? <small>{note}</small> : null}
    </div>
  );
}

// Ranked horizontal bar chart, used on the public feed for the impact index.
function RankedBars({ items, max = 100 }) {
  return (
    <ol className="ranked-bars" aria-label="Ranked structural impact index">
      {items.map((item) => {
        const pct = Math.max(2, Math.min(100, (Number(item.value) / max) * 100));
        return (
          <li key={item.label}>
            <span className="ranked-scope">{item.label}</span>
            <span className="ranked-track">
              <span className="ranked-fill" style={{ width: `${pct}%` }} />
            </span>
            <span className="ranked-value">{item.value}</span>
          </li>
        );
      })}
    </ol>
  );
}

// Two-lane horizon map placing items on a time axis by their stated horizon.
function HorizonMap({ lanes }) {
  const points = lanes.flatMap((lane) => lane.items.map((item) => horizonToYears(item.horizon)).filter((value) => value !== null));
  if (!points.length) return null;
  const maxYears = Math.max(6, ...points);
  const ticks = [0, 1, 3, 5, 10].filter((tick) => tick <= maxYears);
  if (ticks[ticks.length - 1] !== Math.ceil(maxYears)) ticks.push(Math.ceil(maxYears));
  const place = (years) => `${Math.max(1.5, Math.min(98, (years / maxYears) * 100))}%`;
  return (
    <div className="horizon-map" role="img" aria-label="Time-horizon map of opportunities and risks">
      <div className="horizon-axis">
        {ticks.map((tick) => (
          <span key={tick} style={{ left: `${(tick / maxYears) * 100}%` }}>{tick === 0 ? "Now" : `${tick}y`}</span>
        ))}
      </div>
      {lanes.map((lane) => (
        <div className={`horizon-lane horizon-${lane.tone}`} key={lane.label}>
          <span className="horizon-lane-label">{lane.label}</span>
          <div className="horizon-track">
            {lane.items.map((item, index) => {
              const years = horizonToYears(item.horizon);
              if (years === null) return null;
              return <span className="horizon-dot" key={`${item.title}-${index}`} style={{ left: place(years) }} title={`${item.title} · ${item.horizon}`}><em>{item.horizon}</em></span>;
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ----------------------------------------------------------------------------
   Conversion + commerce
---------------------------------------------------------------------------- */

function PricingSection({ user }) {
  const [loading, setLoading] = useState("");
  const [error, setError] = useState("");

  const checkout = async (offer) => {
    if (!user) {
      document.getElementById("access")?.scrollIntoView({ behavior: "smooth" });
      return;
    }
    setLoading(offer);
    setError("");
    try {
      const response = await authorizedFetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ offer })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Unable to open checkout.");
      window.location.assign(payload.url);
    } catch (checkoutError) {
      setError(checkoutError.message || "Unable to open checkout.");
      setLoading("");
    }
  };

  return (
    <section className="pricing-section" id="pricing">
      <div className="section-head">
        <div><p className="kicker">Private intelligence</p><h2>Choose how you use Chronicle Future</h2></div>
        <p>Start with one decision-ready brief, or maintain a standing view of the forces shaping your location.</p>
      </div>
      <div className="pricing-grid">
        <article className="price-card">
          <header><p className="kicker">One-time</p><h3><span className="price-figure">$19</span><span className="price-unit">per brief</span></h3></header>
          <p className="price-copy">One complete location intelligence brief: signals, opportunity scoring, risks, SWOT, and a decade outlook.</p>
          <ul className="price-list">
            <li>Full signal breakdown across six scopes</li>
            <li>Scored opportunities and risks</li>
            <li>Geographic SWOT and decade outlook</li>
          </ul>
          <button className="btn btn-outline" onClick={() => checkout("one_time")} disabled={!!loading}>{loading === "one_time" ? "Opening checkout…" : user ? "Buy one brief" : "Sign in to purchase"}</button>
        </article>
        <article className="price-card featured">
          <span className="price-flag">Most chosen</span>
          <header><p className="kicker light">Monthly intelligence</p><h3><span className="price-figure">$39</span><span className="price-unit">per month</span></h3></header>
          <p className="price-copy">Four briefs every billing period, a saved archive, and access to Chronicle Future's publisher-produced magazine editions.</p>
          <ul className="price-list">
            <li>Four location briefs each period</li>
            <li>Persistent intelligence archive</li>
            <li>Every published magazine edition</li>
          </ul>
          <button className="btn btn-lime" onClick={() => checkout("monthly")} disabled={!!loading}>{loading === "monthly" ? "Opening checkout…" : user ? "Start monthly access" : "Sign in to subscribe"}</button>
        </article>
      </div>
      {error ? <p className="pricing-error" role="alert">{error}</p> : null}
    </section>
  );
}

function formatMarketPrice(value) {
  if (!Number.isFinite(value)) return "--";
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: value >= 1000 ? 0 : 2,
    minimumFractionDigits: value < 10 ? 2 : 0
  }).format(value);
}

/* ----------------------------------------------------------------------------
   Header tickers (markets + news wire) — behavior preserved
---------------------------------------------------------------------------- */

function MarketTicker() {
  const [feed, setFeed] = useState({ market: [], news: [], as_of: null });
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const response = await fetch("/api/market-feed");
        if (!response.ok) throw new Error("Market feed unavailable.");
        const payload = await response.json();
        if (!active) return;
        setFeed({ market: payload.market || [], news: payload.news || [], as_of: payload.as_of || null });
        setStatus(payload.market?.length || payload.news?.length ? "ready" : "empty");
      } catch (error) {
        if (active) setStatus("error");
      }
    };

    load();
    const timer = window.setInterval(load, 300000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, []);

  const renderMarketSet = (copy, hidden = false) => (
    <div className="market-tape-set" aria-hidden={hidden || undefined}>
      {feed.market.length ? feed.market.map((item) => (
        <span className="market-quote" key={`${copy}-${item.symbol}`}>
          <strong>{item.label}</strong>
          <span>{formatMarketPrice(item.price)}</span>
          <em className={item.change_percent > 0 ? "up" : item.change_percent < 0 ? "down" : "flat"}>
            {Number.isFinite(item.change_percent) ? `${item.change_percent >= 0 ? "+" : ""}${item.change_percent.toFixed(2)}%` : "--"}
          </em>
        </span>
      )) : <span className="market-fallback">{status === "loading" ? "Loading delayed prices" : "Market prices temporarily unavailable"}</span>}
    </div>
  );

  const renderNewsSet = (copy, hidden = false) => (
    <div className="market-tape-set" aria-hidden={hidden || undefined}>
      {feed.news.length ? feed.news.map((item, index) => (
        <a className="market-headline" href={item.url} target="_blank" rel="noreferrer" tabIndex={hidden ? -1 : undefined} key={`${copy}-${index}`}>
          <small>{item.source}</small>{item.title}
        </a>
      )) : <span className="market-fallback">{status === "loading" ? "Loading global headlines" : "News feed temporarily unavailable"}</span>}
    </div>
  );

  return (
    <>
      <section className="market-tape market-tape-prices" aria-label="Delayed stock index and commodity prices">
        <div className="market-tape-label"><strong>MARKETS</strong><span>Delayed</span></div>
        <div className={`market-tape-window ${feed.market.length ? "is-moving" : ""}`}>
          <div className="market-tape-track">
            {renderMarketSet("market-primary")}
            {feed.market.length ? renderMarketSet("market-copy", true) : null}
          </div>
        </div>
        <time>{feed.as_of ? new Date(feed.as_of).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : "--"}</time>
      </section>
      <section className="market-tape market-tape-news" aria-label="Global business and economic headlines">
        <div className="market-tape-label"><strong>NEWS WIRE</strong><span>Global</span></div>
        <div className={`market-tape-window ${feed.news.length ? "is-moving" : ""}`}>
          <div className="market-tape-track">
            {renderNewsSet("news-primary")}
            {feed.news.length ? renderNewsSet("news-copy", true) : null}
          </div>
        </div>
        <time>{feed.news.length ? `${feed.news.length} stories` : "--"}</time>
      </section>
    </>
  );
}

function Header({ user, onWorkspace, onHome, onSignOut }) {
  const accountName = user?.user_metadata?.username
    || user?.user_metadata?.full_name
    || user?.email?.split("@")[0]
    || "Account";

  return (
    <div className="header-stack">
      <MarketTicker />
      <header className="site-header">
        <button className="brand" onClick={onHome}>CHRONICLE <span>FUTURE</span></button>
        <nav aria-label="Primary navigation">
          <button className="nav-link" onClick={onHome}>Front page</button>
          {user ? <button className="nav-link" onClick={onWorkspace}>My locations</button> : null}
        </nav>
        {user ? (
          <div className="account-actions">
            <button className="account-identity" onClick={onWorkspace} title={user.email}>
              <span className="account-dot" aria-hidden="true" />
              <span><small>Signed in</small><strong>{accountName}</strong></span>
            </button>
            <button className="signout-button" onClick={onSignOut}>Sign out</button>
          </div>
        ) : <a className="account-button" href="#access">Open your intelligence</a>}
      </header>
    </div>
  );
}

function AuthPanel() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (!cooldown) return undefined;
    const timer = window.setInterval(() => setCooldown((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [cooldown > 0]);

  const submit = async (event) => {
    event.preventDefault();
    if (cooldown) return;
    setLoading(true);
    setStatus("");
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: AUTH_REDIRECT_URL, shouldCreateUser: true }
    });
    if (error) setStatus(error.message);
    else {
      setCooldown(60);
      setStatus("Secure link sent. Open the newest email once; older links expire automatically.");
    }
    setLoading(false);
  };

  return (
    <section className="access-band" id="access">
      <div className="access-copy">
        <p className="kicker light">Your strategic layer</p>
        <h2>See what global change means for your location.</h2>
        <p className="access-sub">One secure link. No passwords to manage.</p>
      </div>
      <form className="access-form" onSubmit={submit}>
        <label htmlFor="email">Work email</label>
        <div className="input-row">
          <input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@company.com" required />
          <button className="btn btn-lime" disabled={loading || cooldown > 0}>{loading ? "Sending…" : cooldown ? `Resend in ${cooldown}s` : "Continue"}</button>
        </div>
        <p className="access-status">{status || "Sign in to unlock location briefs, SWOT, opportunities, risks, and forecasts."}</p>
      </form>
    </section>
  );
}

/* ----------------------------------------------------------------------------
   Public global intelligence feed (landing experience)
---------------------------------------------------------------------------- */

function PublicLanding({ user, onWorkspace, onOpenArticle }) {
  const lead = FEATURE_ARTICLE;
  const ranked = [...PUBLIC_SIGNALS]
    .sort((a, b) => b.impact - a.impact)
    .map((signal) => ({ label: signal.scope, value: signal.impact }));
  const desk = [lead, ...UPCOMING_ARTICLES];
  const serviceSignal = PUBLIC_SIGNALS[1];
  return (
    <main className="editorial-home">
      <section className="news-masthead">
        <div className="news-masthead-row">
          <p className="news-edition">Chronicle Future · Intelligence &amp; Investigations</p>
          <p className="news-dateline">{longDate()}</p>
        </div>
      </section>

      <section className="news-lead" aria-label="Lead investigation">
        <div className="news-lead-main">
          <p className="kicker">{lead.kicker}</p>
          <h1>{lead.title}</h1>
          <p className="news-lead-dek">{lead.dek}</p>
          <p className="news-lead-standfirst">{lead.lead}</p>
          <div className="news-byline">
            <span>By {lead.byline}</span><span>{lead.dateLabel}</span><span>{lead.readingTime}</span>
          </div>
          <button className="btn btn-green" onClick={() => onOpenArticle(lead.slug)}>Read the investigation</button>
        </div>
        <aside className="news-lead-aside">
          <figure className="hero-trend" aria-label="US dollar share of global reserves, 2001 to 2025">
            <figcaption className="hero-trend-head"><span>USD share of global reserves</span><strong>56.9%</strong></figcaption>
            <HeroTrendFigure />
            <p className="hero-trend-note">Down from ~72% in 2001 — the lowest since 1995. Source: IMF COFER.</p>
          </figure>
          <blockquote className="news-lead-quote">
            <p>“{lead.epigraph.quote}”</p>
            <cite>— {lead.epigraph.source}</cite>
          </blockquote>
        </aside>
      </section>

      <section className="editorial-section">
        <header className="editorial-section-head">
          <h2>From the Desk</h2>
          <span>Investigations &amp; analysis</span>
        </header>
        <div className="news-grid">
          {desk.map((story) => {
            const live = story.status !== "upcoming";
            return (
              <article className={live ? "news-card" : "news-card is-upcoming"} key={story.slug}>
                <p className="story-label">{story.category}</p>
                <h3>{story.title}</h3>
                <p className="news-card-dek">{story.cardDek || story.dek}</p>
                <footer>
                  {live
                    ? <button className="text-link" onClick={() => onOpenArticle(story.slug)}>Read the full story →</button>
                    : <span className="news-flag">Coming soon</span>}
                  <time>{story.dateLabel}</time>
                </footer>
              </article>
            );
          })}
        </div>
      </section>

      <section className="editorial-section service-showcase" id="service">
        <header className="editorial-section-head">
          <h2>The Intelligence Service</h2>
          <span>From global signal to local consequence</span>
        </header>
        <div className="service-grid">
          <div className="service-copy">
            <p className="kicker">Private intelligence</p>
            <h3>{serviceSignal.title}</h3>
            <p>Alongside the newsroom, Chronicle Future operates a private decision-support service. It connects world-scale change to a specific city, workforce, industry mix, and business environment — with scored opportunities, risks, geographic SWOT, and a decade outlook.</p>
            <HorizonMap lanes={[
              { label: "Near term", tone: "up", items: PUBLIC_SIGNALS.slice(0, 3).map((item) => ({ title: item.title, horizon: item.horizon })) },
              { label: "Long term", tone: "down", items: PUBLIC_SIGNALS.slice(3).map((item) => ({ title: item.title, horizon: item.horizon })) }
            ]} />
          </div>
          <aside className="service-index">
            <p className="panel-eyebrow">Structural impact index</p>
            <RankedBars items={ranked} />
            <p className="panel-foot">Relative impact across the active global watchlist.</p>
          </aside>
        </div>
      </section>

      <section className="conversion-band">
        <p className="kicker light">From macro to local</p>
        <h2>The signal is global. The consequence is local.</h2>
        <p>Chronicle Future connects world-scale change to a specific city, workforce, industry mix, infrastructure base, and business environment.</p>
        {user ? <button className="btn btn-lime" onClick={onWorkspace}>Open my location intelligence</button> : <a className="btn btn-lime" href="#access">Analyze your location</a>}
      </section>
      <PricingSection user={user} />
      {!user ? <AuthPanel /> : null}

      <footer className="editorial-footer">
        <div className="footer-brand"><strong>CHRONICLE <span>FUTURE</span></strong><p>Intelligence for decisions that cannot wait for certainty.</p></div>
        <div><h3>Newsroom</h3><span>Investigations</span><span>Analysis</span><span>From the desk</span></div>
        <div><h3>Service</h3><span>Location briefs</span><span>Opportunity radar</span><span>Magazine editions</span></div>
        <div><h3>Company</h3><span>About Chronicle Future</span><span>Methodology</span><span>Contact</span></div>
        <small>© {new Date().getFullYear()} Chronicle Future. Independent intelligence and investigations for operators and forward thinkers.</small>
      </footer>
    </main>
  );
}

/* ----------------------------------------------------------------------------
   Editorial figures — sleek, print-safe inline-SVG charts and diagrams
   (Nature-style: hairline rules, restrained palette, numbered captions).
   No external assets, no dependencies.
---------------------------------------------------------------------------- */

const ARROW_DEFS = (
  <defs>
    <marker id="cf-arrow" markerWidth="9" markerHeight="9" refX="6.5" refY="3" orient="auto" markerUnits="userSpaceOnUse">
      <path d="M0,0 L7,3 L0,6 Z" className="c-arrow" />
    </marker>
  </defs>
);

function Figure({ number, title, source, children }) {
  return (
    <figure className="fig">
      <div className="fig-frame">{children}</div>
      <figcaption className="fig-cap">
        <strong>Figure {number}</strong> {title}
        {source ? <span className="fig-source">{source}</span> : null}
      </figcaption>
    </figure>
  );
}

function KeyNumbersFigure() {
  const items = [
    { value: "$39T", label: "US national debt", note: "Crossed in March 2026" },
    { value: "56.9%", label: "USD share of reserves", note: "Q3 2025 · lowest since 1995" },
    { value: "89.2%", label: "USD share of FX trades", note: "2025 · up from 88.4% (2022)" },
    { value: "≈10%", label: "Dollar index decline", note: "2025 · worst in 50+ years" }
  ];
  return (
    <div className="fig-keynumbers">
      {items.map((item) => <KeyNumber key={item.label} value={item.value} label={item.label} note={item.note} />)}
    </div>
  );
}

// The self-reinforcing petrodollar cycle, as a five-step flow that loops back.
function PetrodollarLoopFigure() {
  const steps = [
    ["Oil priced", "in dollars"],
    ["Exporters", "earn dollars"],
    ["Dollars buy", "US Treasuries"],
    ["Cheap US", "borrowing"],
    ["Military", "secures the Gulf"]
  ];
  const boxW = 156, boxH = 64, gap = 25, y = 26;
  return (
    <svg viewBox="0 0 920 210" role="img" aria-label="Diagram: the self-reinforcing petrodollar cycle">
      {ARROW_DEFS}
      {steps.map((lines, index) => {
        const x = 10 + index * (boxW + gap);
        return (
          <g key={index}>
            <rect x={x} y={y} width={boxW} height={boxH} rx="3" className="c-node" />
            <text x={x + boxW / 2} y={y + 27} textAnchor="middle" className="c-node-label">{lines[0]}</text>
            <text x={x + boxW / 2} y={y + 45} textAnchor="middle" className="c-node-label">{lines[1]}</text>
            {index < steps.length - 1
              ? <line x1={x + boxW + 3} y1={y + boxH / 2} x2={x + boxW + gap - 5} y2={y + boxH / 2} className="c-flow" markerEnd="url(#cf-arrow)" />
              : null}
          </g>
        );
      })}
      <path d="M 812 96 C 812 172, 88 172, 88 96" className="c-flow" markerEnd="url(#cf-arrow)" />
      <text x="450" y="194" textAnchor="middle" className="c-label">…and the cycle reinforces itself</text>
    </svg>
  );
}

// Dollar share of global FX reserves: two cited reference points, 2001 → 2025.
function ReserveDeclineFigure() {
  const L = 84, R = 600, T = 24, B = 196, lo = 50, hi = 75;
  const yOf = (v) => B - ((v - lo) / (hi - lo)) * (B - T);
  const grid = [55, 60, 65, 70, 75];
  const p1 = { x: L, y: yOf(72) }, p2 = { x: R, y: yOf(56.9) };
  const mid = (T + B) / 2;
  return (
    <svg viewBox="0 0 640 232" role="img" aria-label="Line chart: USD share of global reserves fell from 72% in 2001 to 56.9% in 2025">
      {grid.map((g) => (
        <g key={g}>
          <line x1={L} y1={yOf(g)} x2={R} y2={yOf(g)} className="c-grid" />
          <text x={L - 10} y={yOf(g) + 4} textAnchor="end" className="c-label">{g}%</text>
        </g>
      ))}
      <line x1={L} y1={B} x2={R} y2={B} className="c-axis" />
      <polygon points={`${p1.x},${p1.y} ${p2.x},${p2.y} ${p2.x},${B} ${p1.x},${B}`} className="c-area" />
      <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} className="c-line" />
      <circle cx={p1.x} cy={p1.y} r="5" className="c-dot" />
      <circle cx={p2.x} cy={p2.y} r="5" className="c-dot" />
      <text x={p1.x + 8} y={p1.y - 10} className="c-value">72.0%</text>
      <text x={p2.x} y={p2.y - 12} textAnchor="end" className="c-value">56.9%</text>
      <text x={L} y={B + 22} textAnchor="middle" className="c-label">2001</text>
      <text x={R} y={B + 22} textAnchor="middle" className="c-label">Q3 2025</text>
      <text x={22} y={mid} textAnchor="middle" className="c-axis-title" transform={`rotate(-90 22 ${mid})`}>Share of allocated reserves</text>
    </svg>
  );
}

// Stylized locator: the Strait of Hormuz chokepoint between the Gulf and open sea.
function HormuzLocatorFigure() {
  return (
    <svg viewBox="0 0 640 240" role="img" aria-label="Locator diagram: the Strait of Hormuz chokepoint between the Gulf and the Gulf of Oman">
      {ARROW_DEFS}
      <rect x="0" y="0" width="640" height="240" className="c-water" />
      <polygon points="0,0 640,0 640,58 408,58 348,104 288,58 0,58" className="c-land" />
      <polygon points="0,240 640,240 640,182 408,182 348,134 288,182 0,182" className="c-land" />
      <path d="M288,58 348,104" className="c-coast" />
      <path d="M408,58 348,104" className="c-coast" />
      <path d="M288,182 348,134" className="c-coast" />
      <path d="M408,182 348,134" className="c-coast" />
      <line x1="70" y1="119" x2="566" y2="119" className="c-flow" strokeWidth="3" markerEnd="url(#cf-arrow)" />
      <circle cx="348" cy="119" r="6" className="c-dot" />
      <text x="348" y="34" textAnchor="middle" className="c-axis-title">Iran</text>
      <text x="348" y="218" textAnchor="middle" className="c-axis-title">Arabian Peninsula</text>
      <text x="120" y="100" textAnchor="middle" className="c-label">The Gulf</text>
      <text x="520" y="100" textAnchor="middle" className="c-label">Gulf of Oman</text>
      <text x="348" y="150" textAnchor="middle" className="c-value">Strait of Hormuz</text>
      <text x="348" y="168" textAnchor="middle" className="c-label">≈20% of world seaborne oil</text>
    </svg>
  );
}

// Central-bank net gold purchases — recent years vs the 2010–21 average.
function GoldBuyingFigure() {
  const cats = [
    { label: "2010–21 avg", value: 473, accent: false },
    { label: "2022", value: 1082, accent: true },
    { label: "2023", value: 1037, accent: true },
    { label: "2024", value: 1045, accent: true }
  ];
  const L = 84, R = 612, T = 46, B = 204, max = 1200, bw = 74;
  const yOf = (v) => B - (v / max) * (B - T);
  const slot = (R - L) / cats.length;
  const mid = (T + B) / 2;
  return (
    <svg viewBox="0 0 640 240" role="img" aria-label="Bar chart: central-bank gold purchases by year in tonnes">
      <g>
        <rect x={L} y="14" width="12" height="12" className="c-bar" /><text x={L + 18} y="24" className="c-label">recent years</text>
        <rect x={L + 138} y="14" width="12" height="12" className="c-bar-2" /><text x={L + 156} y="24" className="c-label">2010–21 average</text>
      </g>
      {[0, 400, 800, 1200].map((g) => (
        <g key={g}>
          <line x1={L} y1={yOf(g)} x2={R} y2={yOf(g)} className="c-grid" />
          <text x={L - 10} y={yOf(g) + 4} textAnchor="end" className="c-label">{g.toLocaleString()}</text>
        </g>
      ))}
      <line x1={L} y1={B} x2={R} y2={B} className="c-axis" />
      {cats.map((c, i) => {
        const cx = L + slot * i + slot / 2;
        const x = cx - bw / 2;
        return (
          <g key={c.label}>
            <rect x={x} y={yOf(c.value)} width={bw} height={B - yOf(c.value)} className={c.accent ? "c-bar" : "c-bar-2"} />
            <text x={cx} y={yOf(c.value) - 8} textAnchor="middle" className="c-value">{c.value.toLocaleString()}</text>
            <text x={cx} y={B + 22} textAnchor="middle" className="c-label">{c.label}</text>
          </g>
        );
      })}
      <text x={22} y={mid} textAnchor="middle" className="c-axis-title" transform={`rotate(-90 22 ${mid})`}>Net purchases (tonnes)</text>
    </svg>
  );
}

// US Treasury holdings, 2013 vs 2025 — China halves, Russia exits.
function TreasuryHoldingsFigure() {
  const groups = [
    { label: "China", a: 1320, b: 756 },
    { label: "Russia", a: 96, b: 2 }
  ];
  const L = 88, R = 612, T = 46, B = 204, max = 1400, bw = 54, pair = 10;
  const yOf = (v) => B - (v / max) * (B - T);
  const slot = (R - L) / groups.length;
  const mid = (T + B) / 2;
  const fmt = (v) => v >= 1000 ? `$${(v / 1000).toFixed(2)}T` : v < 5 ? "≈$0" : `$${v}B`;
  return (
    <svg viewBox="0 0 640 240" role="img" aria-label="Grouped bar chart: US Treasury holdings in 2013 versus 2025 for China and Russia">
      <g>
        <rect x={L} y="14" width="12" height="12" className="c-bar-2" /><text x={L + 18} y="24" className="c-label">2013</text>
        <rect x={L + 66} y="14" width="12" height="12" className="c-bar" /><text x={L + 84} y="24" className="c-label">2025</text>
      </g>
      {[0, 350, 700, 1050, 1400].map((g) => (
        <g key={g}>
          <line x1={L} y1={yOf(g)} x2={R} y2={yOf(g)} className="c-grid" />
          <text x={L - 10} y={yOf(g) + 4} textAnchor="end" className="c-label">{g >= 1000 ? (g / 1000) + "T" : g}</text>
        </g>
      ))}
      <line x1={L} y1={B} x2={R} y2={B} className="c-axis" />
      {groups.map((grp, i) => {
        const cx = L + slot * i + slot / 2;
        return (
          <g key={grp.label}>
            <rect x={cx - bw - pair / 2} y={yOf(grp.a)} width={bw} height={B - yOf(grp.a)} className="c-bar-2" />
            <rect x={cx + pair / 2} y={yOf(grp.b)} width={bw} height={B - yOf(grp.b)} className="c-bar" />
            <text x={cx - bw / 2 - pair / 2} y={yOf(grp.a) - 8} textAnchor="middle" className="c-value">{fmt(grp.a)}</text>
            <text x={cx + bw / 2 + pair / 2} y={yOf(grp.b) - 8} textAnchor="middle" className="c-value">{fmt(grp.b)}</text>
            <text x={cx} y={B + 22} textAnchor="middle" className="c-label">{grp.label}</text>
          </g>
        );
      })}
      <text x={24} y={mid} textAnchor="middle" className="c-axis-title" transform={`rotate(-90 24 ${mid})`}>US Treasury holdings ($)</text>
    </svg>
  );
}

// Share of FX transactions, 2025 — the dollar's persistence vs the yuan.
function FxDominanceFigure() {
  const rows = [
    { label: "US dollar", value: 89.2, accent: true },
    { label: "Chinese yuan", value: 8.5, accent: false }
  ];
  const L = 132, R = 596, top = 22, rh = 42, gap = 20, max = 100;
  const wOf = (v) => (v / max) * (R - L);
  const baseY = top + rows.length * rh + (rows.length - 1) * gap;
  const ticks = [0, 25, 50, 75, 100];
  return (
    <svg viewBox="0 0 640 168" role="img" aria-label="Bar chart: share of FX transactions in 2025, US dollar versus Chinese yuan">
      {ticks.map((t) => (
        <g key={t}>
          <line x1={L + wOf(t)} y1={top - 4} x2={L + wOf(t)} y2={baseY} className="c-grid" />
          <text x={L + wOf(t)} y={baseY + 18} textAnchor="middle" className="c-label">{t}%</text>
        </g>
      ))}
      {rows.map((row, i) => {
        const y = top + i * (rh + gap);
        return (
          <g key={row.label}>
            <text x={L - 12} y={y + rh / 2 + 4} textAnchor="end" className="c-label">{row.label}</text>
            <rect x={L} y={y} width={R - L} height={rh} className="c-track" />
            <rect x={L} y={y} width={wOf(row.value)} height={rh} className={row.accent ? "c-bar" : "c-bar-accent"} />
            <text x={L + wOf(row.value) + 10} y={y + rh / 2 + 5} className="c-value">{row.value}%</text>
          </g>
        );
      })}
      <line x1={L} y1={baseY} x2={R} y2={baseY} className="c-axis" />
      <text x={(L + R) / 2} y={baseY + 36} textAnchor="middle" className="c-axis-title">Share of FX transactions, 2025</text>
    </svg>
  );
}

const FIGURES = {
  "key-numbers": {
    title: "The state of the dollar order, early 2026.",
    source: "Sources: US Treasury; IMF COFER; BIS.",
    render: () => <KeyNumbersFigure />
  },
  "petrodollar-loop": {
    title: "The petrodollar feedback loop — why dollar demand sustains itself.",
    source: "Chronicle Future analysis.",
    render: () => <PetrodollarLoopFigure />
  },
  "reserve-decline": {
    title: "The dollar's receding share of global reserves, ~72% (2001) to 56.9% (Q3 2025) — the lowest since 1995. Points are cited reference years, not a continuous series.",
    source: "Source: IMF COFER.",
    render: () => <ReserveDeclineFigure />
  },
  "hormuz-share": {
    title: "The chokepoint: roughly one-fifth of the world's seaborne oil transits the narrow Strait of Hormuz between the Gulf and the Gulf of Oman.",
    source: "Chronicle Future schematic; not to scale.",
    render: () => <HormuzLocatorFigure />
  },
  "gold-buying": {
    title: "Central-bank net gold purchases topped 1,000 tonnes for three straight years — more than double the prior-decade average.",
    source: "Source: World Gold Council.",
    render: () => <GoldBuyingFigure />
  },
  "treasury-holdings": {
    title: "Reserve repositioning: China roughly halved its US Treasury holdings while Russia exited almost entirely, 2013 to 2025.",
    source: "Source: US Treasury (TIC).",
    render: () => <TreasuryHoldingsFigure />
  },
  "fx-dominance": {
    title: "Reality check: the dollar still sits on one side of 89.2% of FX trades; the yuan, 8.5%. Each trade has two sides, so shares sum to ~200%.",
    source: "Source: BIS Triennial Survey, 2025.",
    render: () => <FxDominanceFigure />
  }
};

// Compact dark trend used in the front-page lead.
function HeroTrendFigure() {
  const L = 26, R = 296, T = 22, B = 96, lo = 50, hi = 75;
  const yOf = (v) => B - ((v - lo) / (hi - lo)) * (B - T);
  const p1 = { x: L, y: yOf(72) }, p2 = { x: R, y: yOf(56.9) };
  return (
    <svg viewBox="0 0 320 140" role="img" aria-label="Trend: USD share of global reserves declined from 72% in 2001 to 56.9% in 2025">
      <polygon points={`${p1.x},${p1.y} ${p2.x},${p2.y} ${p2.x},${B} ${p1.x},${B}`} className="ht-area" />
      <line x1={L} y1={B} x2={R} y2={B} className="ht-axis" />
      <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} className="ht-line" />
      <circle cx={p1.x} cy={p1.y} r="4" className="ht-dot" />
      <circle cx={p2.x} cy={p2.y} r="4" className="ht-dot" />
      <text x={p1.x} y={p1.y - 10} className="ht-val">72%</text>
      <text x={p2.x} y={p2.y - 12} textAnchor="end" className="ht-val">56.9%</text>
      <text x={L} y={B + 18} className="ht-tick">2001</text>
      <text x={R} y={B + 18} textAnchor="end" className="ht-tick">2025</text>
    </svg>
  );
}

/* ----------------------------------------------------------------------------
   Public news article reader
---------------------------------------------------------------------------- */

function NewsArticlePage({ slug, onBack }) {
  const article = NEWS_ARTICLES[slug];
  useEffect(() => { window.scrollTo(0, 0); }, [slug]);
  if (!article) {
    return (
      <main className="page article-page">
        <button className="text-button" onClick={onBack}>← Back to the front page</button>
        <p className="error" role="alert">That article could not be found.</p>
      </main>
    );
  }
  const figureNumbers = {};
  let figureCount = 0;
  article.sections.forEach((section) => (section.figures || []).forEach((id) => { figureCount += 1; figureNumbers[id] = figureCount; }));
  return (
    <main className="article-page">
      <div className="article-toolbar">
        <button className="text-button" onClick={onBack}>← Back to the front page</button>
        <button className="btn btn-outline btn-sm" onClick={() => window.print()}>Print / Save PDF</button>
      </div>
      <article className="article-reader">
        <header className="article-masthead">
          <p className="kicker">{article.kicker}</p>
          <h1>{article.title}</h1>
          <p className="article-dek">{article.dek}</p>
          <p className="article-standfirst">{article.standfirst}</p>
          <div className="article-byline">
            <span>By {article.byline}</span><span>{article.dateLabel}</span><span>{article.readingTime}</span>
          </div>
        </header>
        {article.epigraph ? (
          <blockquote className="article-epigraph">
            <p>“{article.epigraph.quote}”</p>
            <cite>— {article.epigraph.source}</cite>
          </blockquote>
        ) : null}
        <div className="prose">
          {article.sections.map((section, sectionIndex) => (
            <section className="prose-section" key={section.id || sectionIndex}>
              {section.eyebrow ? <p className="prose-eyebrow">{section.eyebrow}</p> : null}
              {section.heading ? <h2>{section.heading}</h2> : null}
              {section.paragraphs.map((paragraph, paragraphIndex) => (
                <Fragment key={paragraphIndex}>
                  <p className={sectionIndex === 0 && paragraphIndex === 0 ? "has-dropcap" : undefined}>{paragraph}</p>
                  {paragraphIndex === 0 && section.pullQuote ? <p className="pull-quote">{section.pullQuote}</p> : null}
                </Fragment>
              ))}
              {section.points ? (
                <ul className="prose-points">
                  {section.points.map((point, pointIndex) => (
                    <li key={pointIndex}><strong>{point.lead}</strong> {point.text}</li>
                  ))}
                </ul>
              ) : null}
              {section.figures ? section.figures.map((figId) => {
                const fig = FIGURES[figId];
                if (!fig) return null;
                return <Figure key={figId} number={figureNumbers[figId]} title={fig.title} source={fig.source}>{fig.render()}</Figure>;
              }) : null}
            </section>
          ))}
        </div>
        {article.sourceNote ? <p className="article-sourcenote">{article.sourceNote}</p> : null}
        <footer className="article-end">
          <button className="text-button" onClick={onBack}>← Back to the front page</button>
        </footer>
      </article>
    </main>
  );
}

/* ----------------------------------------------------------------------------
   Private workspace
---------------------------------------------------------------------------- */

function LocationForm({ userId, onCreated }) {
  const [form, setForm] = useState({ city: "", state: "", zip: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const update = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }));
  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await createLocation(form, userId);
      setForm({ city: "", state: "", zip: "" });
      onCreated();
    } catch (err) { setError(err.message || "Unable to save location."); }
    finally { setSaving(false); }
  };
  return (
    <form className="location-form" onSubmit={submit}>
      <div className="location-form-head"><p className="kicker">New intelligence territory</p><h2>Add a location</h2></div>
      <label>City<input value={form.city} onChange={update("city")} placeholder="Bay City" required /></label>
      <label>State<input value={form.state} onChange={update("state")} placeholder="MI" maxLength={2} required /></label>
      <label>ZIP code<input value={form.zip} onChange={update("zip")} placeholder="48708" inputMode="numeric" required /></label>
      <button className="btn btn-green" disabled={saving}>{saving ? "Saving…" : "Create location"}</button>
      {error ? <p className="error" role="alert">{error}</p> : null}
    </form>
  );
}

function Dashboard({ user, onOpenBrief, onOpenIssue }) {
  const [locations, setLocations] = useState([]);
  const [briefs, setBriefs] = useState([]);
  const [issues, setIssues] = useState([]);
  const [entitlement, setEntitlement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");
  const refresh = async () => {
    setLoading(true);
    try { const data = await loadDashboardData(user.id); setLocations(data.locations); setBriefs(data.briefs); setIssues(data.issues); setEntitlement(data.entitlement); }
    catch (error) { setMessage(error.message || "Unable to load your workspace."); }
    finally { setLoading(false); }
  };
  useEffect(() => { refresh(); }, [user.id]);
  useEffect(() => {
    const checkoutStatus = new URLSearchParams(window.location.search).get("checkout");
    if (checkoutStatus === "success") setMessage("Payment received. Your access will update in a moment.");
    if (checkoutStatus === "cancelled") setMessage("Checkout was cancelled. No charge was made.");
    if (checkoutStatus) window.history.replaceState({}, "", window.location.pathname);
  }, []);
  const briefsByLocation = useMemo(() => briefs.reduce((map, brief) => ({ ...map, [brief.location_id]: [...(map[brief.location_id] || []), brief] }), {}), [briefs]);
  const run = async (type, locationId) => {
    setBusy(`${type}:${locationId}`); setMessage("");
    try {
      const response = await authorizedFetch(type === "ingest" ? "/api/ingest-signals" : "/api/generate-intelligence", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ location_id: locationId }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Request failed.");
      setMessage(type === "ingest" ? `Stored ${payload.saved_count || 0} new signals.` : "Your intelligence brief is ready.");
      if (type === "generate") { await refresh(); if (payload.brief_id) onOpenBrief(payload.brief_id); }
    } catch (error) { setMessage(error.message || "Request failed."); }
    finally { setBusy(""); }
  };
  const createMagazine = async (briefId) => {
    setBusy(`magazine:${briefId}`);
    setMessage("");
    try {
      const response = await authorizedFetch("/api/generate-magazine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brief_id: briefId })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Magazine generation failed.");
      await refresh();
      if (payload.issue_id) onOpenIssue(payload.issue_id);
    } catch (error) { setMessage(error.message || "Magazine generation failed."); }
    finally { setBusy(""); }
  };
  const openBillingPortal = async () => {
    try {
      const response = await authorizedFetch("/api/create-portal-session", { method: "POST" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Unable to open billing.");
      window.location.assign(payload.url);
    } catch (error) { setMessage(error.message || "Unable to open billing."); }
  };
  const allowance = entitlement?.plan === "owner"
    ? "Owner access"
    : entitlement?.plan === "monthly" && entitlement?.status === "active"
      ? `${Math.max(0, entitlement.monthly_brief_limit - entitlement.monthly_briefs_used)} of ${entitlement.monthly_brief_limit} monthly briefs remaining`
      : `${entitlement?.one_time_credits || 0} one-time brief credits`;
  const isPublisher = entitlement?.plan === "owner" && entitlement?.status === "active";
  const magazineAccess = isPublisher || (entitlement?.plan === "monthly" && entitlement?.status === "active");
  const publishedCount = issues.filter((issue) => issue.status === "published").length;
  return (
    <main className="page workspace">
      <section className="workspace-head">
        <div>
          <p className="kicker">Private intelligence workspace</p>
          <h1>Your locations</h1>
          <p className="workspace-deck">Turn global change into local risks, opportunities, SWOT, and forward scenarios.</p>
        </div>
        <LocationForm userId={user.id} onCreated={refresh} />
      </section>
      <section className="plan-bar">
        <div className="plan-id"><span className="account-dot" aria-hidden="true" /><div><small>Current access</small><strong>{allowance}</strong></div></div>
        {entitlement?.stripe_customer_id ? <button className="text-button" onClick={openBillingPortal}>Manage billing</button> : entitlement?.plan !== "owner" ? <a className="text-link" href="#workspace-pricing">View pricing</a> : null}
      </section>
      {message ? <p className="workspace-notice" role="status">{message}</p> : null}

      <section className="workspace-section">
        <div className="section-head compact">
          <div><p className="kicker">Coverage</p><h2>Location portfolio</h2></div>
          <button className="text-button" onClick={refresh}>{loading ? "Refreshing…" : "Refresh"}</button>
        </div>
        <div className="location-list">
          {locations.map((location) => (
            <article className="location-row" key={location.id}>
              <div className="location-id">
                <p className="region">{location.zip}</p>
                <h3>{location.city}, {location.state}</h3>
                <p className="location-count">{briefsByLocation[location.id]?.length || 0} intelligence {(briefsByLocation[location.id]?.length || 0) === 1 ? "brief" : "briefs"}</p>
              </div>
              <div className="location-actions">
                <button className="btn btn-outline" onClick={() => run("ingest", location.id)} disabled={!!busy}>{busy === `ingest:${location.id}` ? "Ingesting…" : "Refresh signals"}</button>
                <button className="btn btn-green" onClick={() => run("generate", location.id)} disabled={!!busy}>{busy === `generate:${location.id}` ? "Generating…" : "Generate brief"}</button>
              </div>
            </article>
          ))}
          {!locations.length && !loading ? <div className="empty-state"><h3>No locations yet</h3><p>Add the first place you want Chronicle Future to monitor.</p></div> : null}
        </div>
      </section>

      {briefs.length ? (
        <section className="workspace-section">
          <div className="section-head compact">
            <div><p className="kicker">Archive</p><h2>Recent briefs</h2></div>
            <p>{isPublisher ? "Open the analysis, or use it as the source for the next Chronicle Future edition." : "Your private archive of location intelligence."}</p>
          </div>
          <div className="brief-list">
            {briefs.map((brief) => (
              <article className="brief-row" key={brief.id}>
                <button className="brief-open" onClick={() => onOpenBrief(brief.id)}>
                  <span className="brief-title">{brief.title || (brief.week_of ? `Weekly intelligence: ${displayDate(brief.week_of)}` : "Intelligence brief")}</span>
                  <small>{displayDate(brief.created_at)}</small>
                </button>
                {isPublisher ? <button className="btn btn-outline btn-sm" onClick={() => createMagazine(brief.id)} disabled={!!busy}>{busy === `magazine:${brief.id}` ? "Writing issue…" : "Produce magazine"}</button> : null}
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <section className={`workspace-section ${isPublisher ? "publisher-studio" : "magazine-library"}`}>
        <div className="section-head compact">
          <div>
            <p className="kicker">{isPublisher ? "Production" : "Chronicle Future editions"}</p>
            <h2>{isPublisher ? "Publisher studio" : "Magazine library"}</h2>
          </div>
          <p>{isPublisher ? "Produce, review, and publish evidence-led editions for Chronicle Future subscribers." : "Read the weekly and monthly editions produced by the Chronicle Future intelligence desk."}</p>
        </div>
        {isPublisher ? <div className="studio-stats"><KeyNumber value={issues.length} label="Editions in studio" /><KeyNumber value={publishedCount} label="Published" /><KeyNumber value={issues.length - publishedCount} label="In production" /></div> : null}
        {issues.length ? (
          <div className="issue-list">
            {issues.map((issue) => (
              <button className="issue-row" key={issue.id} onClick={() => onOpenIssue(issue.id)}>
                <span className="issue-meta">
                  <small className={`status-pill status-${issue.status}`}>{issue.status}</small>
                  <strong>{issue.title}</strong>
                  <em>{issue.subtitle}</em>
                </span>
                <time>{displayDate(issue.edition_date)}</time>
              </button>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <h3>No editions available yet</h3>
            <p>{isPublisher ? "Produce the first edition from a saved intelligence brief." : magazineAccess ? "The next Chronicle Future edition will appear here when it is published." : "Magazine access is included with the monthly subscription."}</p>
          </div>
        )}
      </section>
      {entitlement?.plan !== "owner" ? <div id="workspace-pricing"><PricingSection user={user} /></div> : null}
    </main>
  );
}

/* ----------------------------------------------------------------------------
   Full intelligence brief
---------------------------------------------------------------------------- */

function BriefPage({ briefId, onBack }) {
  const [brief, setBrief] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => { let active = true; loadBrief(briefId).then((data) => active && setBrief(data)).catch((err) => active && setError(err.message)); return () => { active = false; }; }, [briefId]);
  if (error) return <main className="page workspace"><button className="text-button" onClick={onBack}>← Back to locations</button><p className="error" role="alert">{error}</p></main>;
  if (!brief) return <main className="page workspace"><div className="loading-block"><span className="loading-bar" /><span className="loading-bar" /><span className="loading-bar" /><p>Loading intelligence…</p></div></main>;

  const opportunities = brief.opportunities || [];
  const risks = brief.risks || [];
  const horizonLanes = [
    { label: "Opportunities", tone: "up", items: opportunities.map((item) => ({ title: item.title, horizon: item.time_horizon })) },
    { label: "Risks", tone: "down", items: risks.map((item) => ({ title: item.title, horizon: item.time_horizon })) }
  ];
  const hasHorizon = horizonLanes.some((lane) => lane.items.some((item) => horizonToYears(item.horizon) !== null));

  return (
    <main className="page workspace brief-page">
      <button className="text-button" onClick={onBack}>← Back to locations</button>
      <section className="brief-masthead">
        <p className="kicker">Weekly intelligence brief · {displayDate(brief.week_of || brief.created_at)}</p>
        <h1>{brief.title || "Location intelligence"}</h1>
        <p className="brief-lede">{brief.summary || brief.decade_outlook || "A structured view of the signals shaping this location."}</p>
        <div className="brief-stats">
          <KeyNumber value={brief.signals?.length || 0} label="Signals tracked" />
          <KeyNumber value={opportunities.length} label="Opportunities" />
          <KeyNumber value={risks.length} label="Risks" />
        </div>
        {brief.decade_outlook ? <div className="outlook"><strong>Decade outlook</strong><p>{brief.decade_outlook}</p></div> : null}
      </section>

      <section className="brief-section">
        <p className="kicker">Signal scopes</p>
        <div className="brief-grid">
          {SIGNAL_GROUPS.map((group) => {
            const field = BRIEF_FIELDS[group];
            const matching = brief.signals.filter((signal) => (signal.signal_type || "").toLowerCase() === group.toLowerCase());
            return (
              <article className="brief-cell" key={group}>
                <p className="cell-eyebrow">{group}</p>
                {matching.length ? matching.map((signal) => (
                  <div className="brief-item" key={signal.id}>
                    <h3>{signal.title}</h3>
                    <p>{signal.summary}</p>
                    {signal.score ? (
                      <div className="score-meters">
                        <Meter label="Impact" value={signal.score.impact_score} />
                        <Meter label="Confidence" value={signal.score.confidence_score} tone="ink" />
                        <Meter label="Urgency" value={signal.score.urgency_score} tone="amber" />
                      </div>
                    ) : null}
                  </div>
                )) : <p className="brief-copy">{brief[field] || "No signal persisted for this scope."}</p>}
              </article>
            );
          })}
        </div>
      </section>

      <section className="brief-section">
        <p className="kicker">Opportunities &amp; risks</p>
        <div className="two-column">
          <article className="brief-cell">
            <p className="cell-eyebrow up">Opportunities</p>
            {opportunities.length ? opportunities.map((item) => (
              <div className="brief-item" key={item.id}>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
                <Meter label="Opportunity score" value={item.opportunity_score} tone="up" />
                <ul className="tag-row">
                  {item.confidence_level ? <li>Confidence: {item.confidence_level}</li> : null}
                  {item.capital_requirement ? <li>{item.capital_requirement} capital</li> : null}
                  {item.time_horizon ? <li>{item.time_horizon}</li> : null}
                </ul>
              </div>
            )) : <p className="brief-copy">No opportunities recorded for this brief.</p>}
          </article>
          <article className="brief-cell">
            <p className="cell-eyebrow down">Risks</p>
            {risks.length ? risks.map((item) => (
              <div className="brief-item" key={item.id}>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
                <Meter label="Risk score" value={item.risk_score} tone="down" />
                <ul className="tag-row">
                  {item.severity ? <li>{item.severity} severity</li> : null}
                  {item.time_horizon ? <li>{item.time_horizon}</li> : null}
                </ul>
                {item.mitigation ? <p className="mitigation"><strong>Mitigation</strong> {item.mitigation}</p> : null}
              </div>
            )) : <p className="brief-copy">No risks recorded for this brief.</p>}
          </article>
        </div>
      </section>

      {hasHorizon ? (
        <section className="brief-section">
          <p className="kicker">Time horizon</p>
          <div className="brief-cell">
            <p className="cell-eyebrow">When it lands</p>
            <HorizonMap lanes={horizonLanes} />
          </div>
        </section>
      ) : null}

      <section className="brief-section">
        <p className="kicker">Geographic SWOT</p>
        <div className="swot-grid">
          {[
            { key: "strengths", tone: "up" },
            { key: "weaknesses", tone: "down" },
            { key: "opportunities", tone: "up" },
            { key: "threats", tone: "down" }
          ].map(({ key, tone }) => (
            <article className={`swot-cell swot-${tone}`} key={key}>
              <p className="cell-eyebrow">{key}</p>
              <ul>{(Array.isArray(brief.swot[key]) ? brief.swot[key] : []).map((item) => <li key={item}>{item}</li>)}</ul>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

/* ----------------------------------------------------------------------------
   Magazine — reader edition + publisher studio
---------------------------------------------------------------------------- */

const articleParagraphs = (body) => String(body || "").split(/\n\s*\n/).filter(Boolean);
// Treat a pull quote that leads with a figure ($, %, or a number) as a key statistic.
const isStatQuote = (text) => /^[\s$£€]*\d/.test(String(text || "").trim());

function MagazineReader({ issue, articles }) {
  const sectionsSeen = new Set();
  return (
    <article className="magazine-edition">
      <section className="magazine-cover">
        <div className="cover-frame">
          <header className="cover-top">
            <span className="magazine-brand">CHRONICLE <span>FUTURE</span></span>
            <span className="cover-edition">No. {displayDate(issue.edition_date)}</span>
          </header>
          <div className="cover-asset" role="img" aria-label="Edition cover artwork placeholder">
            <span className="cover-asset-mark">CF</span>
            <span className="cover-asset-note">Intelligence edition</span>
          </div>
          <div className="cover-headline">
            <p className="kicker light">{issue.status === "published" ? "Published edition" : issue.status}</p>
            <h1>{issue.title}</h1>
            {issue.subtitle ? <h2>{issue.subtitle}</h2> : null}
            {issue.dek ? <p className="cover-dek">{issue.dek}</p> : null}
          </div>
          <footer className="cover-foot">Location intelligence · Strategy · Opportunity</footer>
        </div>
      </section>

      {articles.length ? (
        <section className="magazine-contents">
          <p className="kicker">In this edition</p>
          <ol className="toc">
            {articles.map((article, index) => (
              <li key={article.id}>
                <span className="toc-num">{String(index + 1).padStart(2, "0")}</span>
                <span className="toc-body"><strong>{article.headline}</strong><em>{article.section}</em></span>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      {issue.editor_note ? (
        <section className="editor-note">
          <p className="kicker">From the editor</p>
          <h2>Why this issue matters</h2>
          {articleParagraphs(issue.editor_note).map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          <p className="editor-sign">— The Chronicle Future Intelligence Desk</p>
        </section>
      ) : null}

      {articles.map((article, index) => {
        const showOpener = article.section && !sectionsSeen.has(article.section);
        if (article.section) sectionsSeen.add(article.section);
        const isLead = index === 0;
        const paragraphs = articleParagraphs(article.body);
        const stat = isStatQuote(article.pull_quote);
        return (
          <div className="magazine-block" key={article.id}>
            {showOpener ? (
              <section className="section-opener">
                <span className="section-opener-num">{String(index + 1).padStart(2, "0")}</span>
                <p className="kicker">Section</p>
                <h2>{article.section}</h2>
              </section>
            ) : null}
            <section className={`magazine-article ${isLead ? "is-lead" : ""}`}>
              <header className="article-head">
                <p className="kicker">{article.section}</p>
                <h2>{article.headline}</h2>
                {article.subheadline ? <h3>{article.subheadline}</h3> : null}
                <p className="byline">By {article.byline}</p>
              </header>
              <div className="article-body">
                {stat && article.pull_quote ? (
                  <aside className="stat-callout"><strong>{article.pull_quote}</strong></aside>
                ) : null}
                {paragraphs.map((paragraph, paragraphIndex) => (
                  paragraphIndex === 1 && article.pull_quote && !stat
                    ? <div className="quote-wrap" key={`${paragraph}-q`}><blockquote className="pull-quote">{article.pull_quote}</blockquote><p>{paragraph}</p></div>
                    : <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
              <footer className="article-source">Sources · {article.source_note || "Chronicle Future synthesis"}</footer>
            </section>
          </div>
        );
      })}
    </article>
  );
}

function MagazinePage({ issueId, user, onBack }) {
  const [issue, setIssue] = useState(null);
  const [articles, setArticles] = useState([]);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  useEffect(() => {
    let active = true;
    loadMagazine(issueId).then((data) => {
      if (!active) return;
      setIssue(data.issue);
      setArticles(data.articles);
    }).catch((error) => active && setMessage(error.message));
    return () => { active = false; };
  }, [issueId]);
  const updateIssue = (field) => (event) => setIssue((current) => ({ ...current, [field]: event.target.value }));
  const updateArticle = (index, field) => (event) => setArticles((current) => current.map((article, articleIndex) => articleIndex === index ? { ...article, [field]: event.target.value } : article));
  const save = async () => {
    setSaving(true);
    setMessage("");
    try { await saveMagazine(issue, articles); setMessage("Draft saved."); setEditing(false); }
    catch (error) { setMessage(error.message || "Unable to save the draft."); }
    finally { setSaving(false); }
  };
  if (!issue) return <main className="page magazine-page"><button className="text-button" onClick={onBack}>← Back to workspace</button><div className="loading-block"><span className="loading-bar" /><span className="loading-bar" /><p>{message || "Loading magazine…"}</p></div></main>;
  const canEdit = issue.user_id === user.id;
  return (
    <main className={`page magazine-page ${editing && canEdit ? "is-studio" : ""}`}>
      <div className={`studio-toolbar ${editing && canEdit ? "studio-mode" : ""}`}>
        <div className="toolbar-left">
          <button className="text-button" onClick={onBack}>← Back to workspace</button>
          {canEdit ? <span className={`status-pill status-${issue.status}`}>{issue.status}</span> : null}
          {editing && canEdit ? <span className="studio-flag">Publisher studio</span> : null}
        </div>
        <div className="toolbar-right">
          {message ? <span className="toolbar-msg">{message}</span> : null}
          {canEdit ? <button className="btn btn-outline btn-sm" onClick={() => setEditing((value) => !value)}>{editing ? "Preview" : "Edit issue"}</button> : null}
          {editing && canEdit ? <button className="btn btn-green btn-sm" onClick={save} disabled={saving}>{saving ? "Saving…" : "Save changes"}</button> : <button className="btn btn-outline btn-sm" onClick={() => window.print()}>Print / Save PDF</button>}
        </div>
      </div>
      {editing && canEdit ? (
        <section className="magazine-editor">
          <div className="editor-heading">
            <div><p className="kicker">Issue settings</p><h1>Edit publication</h1></div>
            <label className="editor-status">Status<select value={issue.status} onChange={updateIssue("status")}><option value="draft">Draft</option><option value="review">In review</option><option value="published">Published</option></select></label>
          </div>
          <div className="editor-fields">
            <label>Title<input value={issue.title} onChange={updateIssue("title")} /></label>
            <label>Subtitle<input value={issue.subtitle} onChange={updateIssue("subtitle")} /></label>
            <label>Cover deck<textarea value={issue.dek} onChange={updateIssue("dek")} rows={3} /></label>
            <label>Editor's note<textarea value={issue.editor_note} onChange={updateIssue("editor_note")} rows={5} /></label>
          </div>
          {articles.map((article, index) => (
            <article className="article-editor" key={article.id}>
              <div className="article-editor-head"><p className="kicker">Article {String(index + 1).padStart(2, "0")}</p><h2>{article.headline || "Untitled article"}</h2></div>
              <div className="editor-grid">
                <label>Section<input value={article.section} onChange={updateArticle(index, "section")} /></label>
                <label>Status<select value={article.status} onChange={updateArticle(index, "status")}><option value="draft">Draft</option><option value="review">In review</option><option value="approved">Approved</option></select></label>
              </div>
              <label>Headline<input value={article.headline} onChange={updateArticle(index, "headline")} /></label>
              <label>Subheadline<textarea value={article.subheadline} onChange={updateArticle(index, "subheadline")} rows={2} /></label>
              <label>Article body<textarea value={article.body} onChange={updateArticle(index, "body")} rows={18} /></label>
              <label>Pull quote<textarea value={article.pull_quote} onChange={updateArticle(index, "pull_quote")} rows={3} /></label>
              <label>Source note<input value={article.source_note} onChange={updateArticle(index, "source_note")} /></label>
            </article>
          ))}
        </section>
      ) : (
        <MagazineReader issue={issue} articles={articles} />
      )}
    </main>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [view, setView] = useState("public");
  const [briefId, setBriefId] = useState(null);
  const [issueId, setIssueId] = useState(null);
  const [articleSlug, setArticleSlug] = useState(null);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const sessionUser = data.session?.user || null;
      setUser(sessionUser);
      if (sessionUser) setView("workspace");
      setAuthReady(true);
    });
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      const sessionUser = session?.user || null;
      setUser(sessionUser);
      if (sessionUser && (event === "SIGNED_IN" || event === "INITIAL_SESSION")) {
        setView("workspace");
        setBriefId(null);
        setIssueId(null);
      }
      setAuthReady(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);
  const home = () => { setView("public"); setBriefId(null); setIssueId(null); setArticleSlug(null); window.scrollTo(0, 0); };
  const workspace = () => { if (user) { setView("workspace"); setBriefId(null); setIssueId(null); setArticleSlug(null); window.scrollTo(0, 0); } };
  const signOut = async () => { await supabase.auth.signOut(); home(); };
  const openBrief = (id) => { setIssueId(null); setBriefId(id); window.scrollTo(0, 0); };
  const openIssue = (id) => { setBriefId(null); setIssueId(id); window.scrollTo(0, 0); };
  const openArticle = (slug) => { setView("public"); setBriefId(null); setIssueId(null); setArticleSlug(slug); window.scrollTo(0, 0); };
  return (
    <>
      <style>{STYLES}</style>
      <a className="skip-link" href="#cf-content">Skip to intelligence</a>
      <Header user={user} onHome={home} onWorkspace={workspace} onSignOut={signOut} />
      <div id="cf-content" tabIndex={-1}>
        {!authReady
          ? <main className="loading-screen">Loading Chronicle Future…</main>
          : issueId ? <MagazinePage issueId={issueId} user={user} onBack={workspace} />
          : briefId ? <BriefPage briefId={briefId} onBack={workspace} />
          : articleSlug ? <NewsArticlePage slug={articleSlug} onBack={home} />
          : view === "workspace" && user ? <Dashboard user={user} onOpenBrief={openBrief} onOpenIssue={openIssue} />
          : <PublicLanding user={user} onWorkspace={workspace} onOpenArticle={openArticle} />}
      </div>
    </>
  );
}

const STYLES = `
  :root {
    /* Palette — ink, cream, powder blue, neutral */
    --ink: #18242b;
    --ink-2: #3f5059;
    --ink-3: #65747b;
    --ink-4: #7f8b91;
    --paper: #f3f4f1;
    --paper-2: #fbfcfa;
    --paper-3: #eef1ec;
    --green: #2f789f;
    --green-700: #315f78;
    --green-800: #24485c;
    --green-900: #183441;
    --green-deep: #1e465a;
    --lime: #a9dcf4;
    --lime-soft: #c5e9f8;
    --line: #d5cec2;
    --line-soft: #e2dbd0;
    --line-strong: #c7beb0;
    --up: #1f9d63;
    --up-soft: #8fe0b8;
    --down: #c2483b;
    --down-soft: #ff9e92;
    --amber: #b07a14;
    --focus: #2f789f;
    /* Type */
    --serif: "Iowan Old Style", "Palatino Linotype", Palatino, Georgia, "Times New Roman", serif;
    --sans: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    --mono: ui-monospace, "SFMono-Regular", "Cascadia Code", Menlo, Consolas, monospace;
    /* Scale */
    --maxw: 1240px;
    --gutter: clamp(16px, 4vw, 24px);
    --r: 4px;
    color: var(--ink);
    background: var(--paper);
    font-family: var(--sans);
    font-synthesis: none;
    -webkit-font-smoothing: antialiased;
    text-rendering: optimizeLegibility;
  }
  * { box-sizing: border-box; }
  body { margin: 0; background: var(--paper); color: var(--ink); }
  button, input, textarea, select { font: inherit; color: inherit; }
  button, a { -webkit-tap-highlight-color: transparent; }
  button { cursor: pointer; }
  h1, h2, h3, p { margin-top: 0; }
  h1, h2, h3 { font-family: var(--serif); font-weight: 600; letter-spacing: -0.01em; }
  a { color: var(--green); }
  :focus-visible { outline: 2px solid var(--focus); outline-offset: 2px; border-radius: 2px; }
  .skip-link { position: absolute; left: -9999px; top: 0; z-index: 100; background: var(--green); color: #fff; padding: 10px 16px; font-weight: 800; font-size: 13px; }
  .skip-link:focus { left: 8px; top: 8px; }
  #cf-content:focus { outline: none; }

  /* Reusable primitives */
  .page { max-width: var(--maxw); margin: auto; padding: clamp(40px, 6vw, 82px) var(--gutter); }
  .kicker { margin: 0 0 10px; color: var(--green); font-size: 11px; font-weight: 900; letter-spacing: .16em; text-transform: uppercase; }
  .kicker.light { color: var(--lime-soft); }
  .btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; border: 0; border-radius: var(--r); padding: 13px 18px; font-size: 14px; font-weight: 800; text-decoration: none; transition: transform .08s ease, background .15s ease, opacity .15s ease; }
  .btn:active { transform: translateY(1px); }
  .btn:disabled { opacity: .55; cursor: wait; }
  .btn-sm { padding: 9px 13px; font-size: 12px; }
  .btn-green { background: var(--green); color: #fff; }
  .btn-green:hover { background: #286789; }
  .btn-lime { background: var(--lime); color: #17303d; }
  .btn-lime:hover { background: #94cee9; }
  .btn-outline { border: 1px solid var(--green); background: transparent; color: var(--green); }
  .btn-outline:hover { background: rgba(47,120,159,.10); }
  .text-button, .text-link { border: 0; background: none; color: var(--green); padding: 0; font-size: 13px; font-weight: 800; text-decoration: none; }
  .text-button:hover, .text-link:hover { text-decoration: underline; }
  .error, .workspace-notice { color: var(--down); font-weight: 700; }
  .section-head { display: flex; align-items: flex-end; justify-content: space-between; gap: 30px; margin-bottom: 34px; }
  .section-head.compact { margin-bottom: 22px; }
  .section-head h2 { margin: 0; font-size: clamp(28px, 4vw, 42px); }
  .section-head > p { max-width: 420px; margin: 0; color: var(--ink-3); line-height: 1.55; }
  .panel-eyebrow, .cell-eyebrow, .panel-foot { font-size: 11px; font-weight: 900; letter-spacing: .12em; text-transform: uppercase; }
  .cell-eyebrow { color: var(--green); margin: 0 0 14px; }
  .cell-eyebrow.up { color: var(--up); }
  .cell-eyebrow.down { color: var(--down); }

  /* Loading + skeleton */
  .loading-screen { min-height: 60vh; display: grid; place-items: center; color: var(--ink-3); }
  .loading-block { display: grid; gap: 12px; max-width: 520px; padding: 30px 0; }
  .loading-bar { height: 14px; border-radius: 3px; background: linear-gradient(90deg, var(--paper-3), #e7e0d6, var(--paper-3)); background-size: 200% 100%; animation: shimmer 1.3s linear infinite; }
  .loading-bar:nth-child(2) { width: 80%; } .loading-bar:nth-child(3) { width: 60%; }
  .loading-block p { color: var(--ink-3); }
  @keyframes shimmer { to { background-position: -200% 0; } }

  /* Data primitives */
  .meter { display: grid; grid-template-columns: 92px 1fr 38px; align-items: center; gap: 10px; margin-top: 8px; font-size: 11px; }
  .meter-label { color: var(--ink-3); font-weight: 800; text-transform: uppercase; letter-spacing: .06em; }
  .meter-track { height: 6px; border-radius: 3px; background: var(--line-soft); overflow: hidden; }
  .meter-fill { display: block; height: 100%; background: var(--green); }
  .meter-ink .meter-fill { background: var(--ink-2); }
  .meter-up .meter-fill { background: var(--up); }
  .meter-down .meter-fill { background: var(--down); }
  .meter-amber .meter-fill { background: var(--amber); }
  .meter-value { color: var(--ink); font-weight: 800; font-variant-numeric: tabular-nums; text-align: right; }
  .key-number { display: grid; gap: 2px; }
  .key-number strong { font-family: var(--serif); font-size: clamp(30px, 5vw, 46px); font-weight: 600; line-height: 1; color: var(--ink); font-variant-numeric: tabular-nums; }
  .key-number span { color: var(--ink-3); font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: .06em; }
  .key-number small { color: var(--ink-4); font-size: 11px; }
  .ranked-bars { list-style: none; margin: 0; padding: 0; display: grid; gap: 11px; }
  .ranked-bars li { display: grid; grid-template-columns: 1fr 30px; align-items: center; gap: 8px; }
  .ranked-scope { grid-column: 1 / -1; color: var(--ink-2); font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: .05em; }
  .ranked-track { height: 8px; border-radius: 4px; background: var(--line-soft); overflow: hidden; }
  .ranked-fill { display: block; height: 100%; background: var(--green); }
  .ranked-value { font-size: 12px; font-weight: 800; color: var(--ink); text-align: right; font-variant-numeric: tabular-nums; }
  .horizon-map { display: grid; gap: 16px; margin-top: 8px; }
  .horizon-axis { position: relative; height: 16px; border-bottom: 1px solid var(--line); }
  .horizon-axis span { position: absolute; transform: translateX(-50%); color: var(--ink-4); font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .05em; }
  .horizon-lane-label { font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: .1em; }
  .horizon-up .horizon-lane-label { color: var(--up); }
  .horizon-down .horizon-lane-label { color: var(--down); }
  .horizon-track { position: relative; height: 40px; margin-top: 8px; border-left: 1px solid var(--line); }
  .horizon-track::before { content: ""; position: absolute; left: 0; right: 0; top: 50%; border-top: 1px dashed var(--line); }
  .horizon-dot { position: absolute; top: 50%; transform: translate(-50%, -50%); width: 12px; height: 12px; border-radius: 50%; }
  .horizon-up .horizon-dot { background: var(--up); }
  .horizon-down .horizon-dot { background: var(--down); }
  .horizon-dot em { position: absolute; left: 50%; top: 16px; transform: translateX(-50%); white-space: nowrap; font-style: normal; font-size: 9px; color: var(--ink-3); font-weight: 700; }

  /* Header tickers */
  .header-stack { position: sticky; top: 0; z-index: 20; }
  .market-tape { height: 34px; display: grid; grid-template-columns: auto minmax(0, 1fr) auto; align-items: center; overflow: hidden; background: var(--green-900); color: #d9edf7; border-bottom: 1px solid #315b70; font-size: 11px; }
  .market-tape-label { align-self: stretch; z-index: 2; display: flex; align-items: center; gap: 8px; padding: 0 16px; padding-left: max(16px, env(safe-area-inset-left)); background: var(--green-700); white-space: nowrap; }
  .market-tape-label strong { color: var(--lime); font-size: 10px; letter-spacing: .1em; }
  .market-tape-label span { color: #a9c6d3; font-size: 9px; text-transform: uppercase; }
  .market-tape-window { min-width: 0; overflow: hidden; }
  .market-tape-track { width: max-content; display: flex; }
  .market-tape-window.is-moving .market-tape-track { animation: market-scroll 58s linear infinite; }
  .market-tape-prices .market-tape-track { animation-duration: 44s; }
  .market-tape-news { background: var(--green-800); }
  .market-tape-news .market-tape-label { background: #2b607d; }
  .market-tape-news .market-tape-label strong { color: var(--lime-soft); }
  .market-tape-news .market-tape-track { animation-duration: 78s; }
  .market-tape-news > time { background: var(--green-800); }
  .market-tape-window.is-moving:hover .market-tape-track, .market-tape-window.is-moving:focus-within .market-tape-track { animation-play-state: paused; }
  .market-tape-set { display: flex; align-items: center; gap: 28px; padding: 0 14px; white-space: nowrap; }
  .market-quote { display: flex; align-items: baseline; gap: 7px; }
  .market-quote strong { color: #f7fbfd; font-size: 10px; letter-spacing: .04em; }
  .market-quote span { color: #c8dde7; font-variant-numeric: tabular-nums; }
  .market-quote em { font-size: 10px; font-style: normal; font-variant-numeric: tabular-nums; }
  .market-quote .up { color: var(--up-soft); }
  .market-quote .down { color: var(--down-soft); }
  .market-quote .flat { color: #afc7d2; }
  .market-headline { max-width: 520px; overflow: hidden; color: #e7f2f7; text-decoration: none; text-overflow: ellipsis; }
  .market-headline small { margin-right: 8px; color: var(--up-soft); font-size: 9px; font-weight: 900; letter-spacing: .08em; text-transform: uppercase; }
  .market-headline:hover { color: var(--lime); }
  .market-fallback { color: #afc7d2; }
  .market-tape > time { z-index: 2; padding: 0 14px; background: var(--green-900); color: #89a8b7; font-size: 9px; font-variant-numeric: tabular-nums; }
  @keyframes market-scroll { to { transform: translateX(-50%); } }

  /* Site header */
  .site-header { height: 66px; padding: 0 max(var(--gutter), calc((100vw - var(--maxw)) / 2)); display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; border-bottom: 1px solid var(--line); background: rgba(243,244,241,.97); backdrop-filter: saturate(1.1) blur(6px); }
  .brand { border: 0; background: none; padding: 0; justify-self: start; color: var(--ink); font-weight: 900; letter-spacing: .05em; font-size: 15px; }
  .brand span { color: var(--green); }
  nav { display: flex; gap: 28px; }
  .nav-link { border: 0; background: none; color: var(--ink-2); padding: 8px 0; font-size: 14px; font-weight: 600; }
  .nav-link:hover { color: var(--green); }
  .account-button { justify-self: end; border: 1px solid var(--green-700); border-radius: var(--r); background: var(--green-700); color: #fff; padding: 10px 15px; font-size: 13px; font-weight: 700; text-decoration: none; }
  .account-button:hover { background: var(--green); }
  .account-actions { justify-self: end; display: flex; align-items: center; gap: 10px; }
  .account-identity { display: flex; align-items: center; gap: 9px; border: 0; background: transparent; color: var(--ink); padding: 5px 0; text-align: left; }
  .account-identity span:last-child { display: grid; gap: 1px; }
  .account-identity small { color: var(--ink-4); font-size: 9px; font-weight: 800; letter-spacing: .1em; text-transform: uppercase; }
  .account-identity strong { max-width: 150px; overflow: hidden; font-size: 13px; text-overflow: ellipsis; white-space: nowrap; }
  .account-dot { width: 9px; height: 9px; border-radius: 50%; background: #20a66a; box-shadow: 0 0 0 4px rgba(32,166,106,.12); flex: none; }
  .signout-button { border: 1px solid var(--line-strong); border-radius: var(--r); background: transparent; color: var(--ink-2); padding: 8px 10px; font-size: 11px; font-weight: 800; }
  .signout-button:hover { border-color: var(--green); color: var(--green); }

  /* Public feed hero */
  .feed-hero { display: grid; grid-template-columns: 1.05fr .95fr; gap: clamp(32px, 5vw, 68px); align-items: center; max-width: var(--maxw); margin: auto; padding: clamp(40px, 6vw, 70px) var(--gutter); }
  .hero-copy h1 { max-width: 720px; margin: 0 0 24px; font-size: clamp(40px, 7vw, 72px); line-height: .98; }
  .hero-deck { max-width: 700px; margin: 0; color: var(--ink-2); font-size: clamp(17px, 2.4vw, 20px); line-height: 1.6; }
  .feed-meta { display: flex; align-items: center; flex-wrap: wrap; gap: 10px; margin-top: 30px; color: var(--ink-3); font-size: 12px; text-transform: uppercase; letter-spacing: .08em; font-weight: 700; }
  .feed-meta-date { text-transform: none; letter-spacing: 0; color: var(--ink-4); font-weight: 600; }
  .live-dot { width: 8px; height: 8px; border-radius: 50%; background: #20a66a; box-shadow: 0 0 0 4px rgba(32,166,106,.12); }
  .lead-signal { border-top: 4px solid var(--green); background: #fff; padding: clamp(24px, 4vw, 36px); box-shadow: 0 22px 60px rgba(25,42,33,.09); }
  .signal-topline { display: flex; justify-content: space-between; gap: 16px; color: var(--green); font-size: 11px; font-weight: 900; letter-spacing: .11em; text-transform: uppercase; }
  .region { margin: 14px 0 10px; color: var(--ink-4); font-size: 12px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; }
  .lead-signal h2 { margin: 0 0 16px; font-size: clamp(26px, 4vw, 38px); line-height: 1.1; }
  .lead-body, .signal-body { color: var(--ink-2); line-height: 1.65; }
  .horizon-row { display: flex; justify-content: space-between; align-items: baseline; border-top: 1px solid var(--line-soft); margin-top: 20px; padding-top: 14px; color: var(--ink-3); font-size: 12px; text-transform: uppercase; letter-spacing: .08em; font-weight: 700; }
  .horizon-row strong { color: var(--ink); }

  /* Watchlist rule */
  .watchlist { display: flex; flex-wrap: wrap; align-items: center; gap: clamp(16px, 3vw, 34px); background: var(--green-700); color: #d9edf7; padding: 14px var(--gutter); font-size: 11px; font-weight: 800; letter-spacing: .1em; text-transform: uppercase; }
  .watchlist-label { color: var(--lime-soft); }

  /* Major signals */
  .feed-section { max-width: var(--maxw); margin: auto; padding: clamp(48px, 7vw, 82px) var(--gutter); }
  .feed-layout { display: grid; grid-template-columns: 280px 1fr; gap: 0; border-top: 1px solid var(--line-strong); border-left: 1px solid var(--line-strong); }
  .impact-index { padding: 26px 24px; border-right: 1px solid var(--line-strong); border-bottom: 1px solid var(--line-strong); background: var(--paper-2); }
  .impact-index .panel-eyebrow { color: var(--green); margin: 0 0 18px; }
  .impact-index .panel-foot { margin: 18px 0 0; color: var(--ink-4); text-transform: none; letter-spacing: 0; font-weight: 600; }
  .feed-grid { display: grid; grid-template-columns: repeat(2, 1fr); }
  .signal-card { position: relative; min-height: 300px; display: flex; flex-direction: column; padding: 26px; border-right: 1px solid var(--line-strong); border-bottom: 1px solid var(--line-strong); background: #fff; }
  .signal-number { margin-bottom: 30px; color: var(--ink-4); font-family: var(--serif); font-size: 26px; font-variant-numeric: tabular-nums; }
  .signal-card h3 { margin: 12px 0 12px; font-size: clamp(20px, 2.4vw, 26px); line-height: 1.16; }
  .signal-card .signal-body { flex: 1; }
  .signal-card .horizon-row { margin-top: 18px; }

  /* Conversion */
  .conversion-band { padding: clamp(56px, 8vw, 88px) max(var(--gutter), calc((100vw - 1000px) / 2)); text-align: center; background: var(--green-deep); color: #fff; }
  .conversion-band h2 { margin: 0 auto 20px; max-width: 760px; font-size: clamp(32px, 5vw, 52px); }
  .conversion-band > p:not(.kicker) { max-width: 700px; margin: 0 auto 28px; color: #b9d2dd; font-size: clamp(16px, 2.2vw, 18px); line-height: 1.6; }

  /* Pricing */
  .pricing-section { max-width: 1040px; margin: 0 auto; padding: clamp(48px, 7vw, 82px) var(--gutter); }
  .pricing-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; align-items: stretch; }
  .price-card { position: relative; display: flex; flex-direction: column; gap: 18px; border: 1px solid var(--line-strong); border-radius: 6px; background: #fff; padding: 32px; }
  .price-card.featured { border-color: var(--green-700); background: var(--green-700); color: #fff; }
  .price-card header h3 { display: flex; flex-direction: column; gap: 4px; margin: 0; font-family: var(--sans); }
  .price-figure { font-family: var(--serif); font-size: 46px; font-weight: 600; line-height: 1; }
  .price-unit { font-size: 13px; font-weight: 700; color: var(--ink-3); text-transform: uppercase; letter-spacing: .06em; }
  .price-card.featured .price-unit { color: #c8dde7; }
  .price-copy { margin: 0; color: var(--ink-3); line-height: 1.55; }
  .price-card.featured .price-copy { color: #d2e7f0; }
  .price-list { margin: 0; padding: 0 0 0 0; list-style: none; display: grid; gap: 8px; }
  .price-list li { position: relative; padding-left: 22px; color: var(--ink-2); font-size: 14px; line-height: 1.4; }
  .price-list li::before { content: ""; position: absolute; left: 2px; top: 7px; width: 8px; height: 8px; border-radius: 50%; background: var(--green); }
  .price-card.featured .price-list li { color: #deeff7; }
  .price-card.featured .price-list li::before { background: var(--lime); }
  .price-card .btn { margin-top: auto; }
  .price-flag { position: absolute; top: -11px; left: 24px; background: var(--lime); color: #17303d; padding: 4px 10px; border-radius: 3px; font-size: 10px; font-weight: 900; letter-spacing: .08em; text-transform: uppercase; }
  .pricing-error { margin: 18px 0 0; color: var(--down); font-weight: 800; text-align: center; }

  /* Auth */
  .access-band { display: grid; grid-template-columns: .9fr 1.1fr; gap: clamp(32px, 6vw, 80px); align-items: center; padding: clamp(44px, 6vw, 70px) max(var(--gutter), calc((100vw - 1100px) / 2)); background: var(--green); color: #fff; }
  .access-copy h2 { margin: 0 0 12px; font-size: clamp(28px, 4vw, 42px); }
  .access-sub { margin: 0; color: #d7eaf2; }
  .access-form label { display: block; margin-bottom: 9px; font-size: 13px; font-weight: 800; }
  .input-row { display: grid; grid-template-columns: 1fr auto; }
  .input-row input { min-width: 0; border: 0; padding: 15px; border-radius: var(--r) 0 0 var(--r); }
  .input-row .btn { border-radius: 0 var(--r) var(--r) 0; }
  .access-status { margin: 10px 0 0; color: #d7eaf2; font-size: 12px; }

  /* Workspace */
  .workspace { display: grid; gap: clamp(36px, 5vw, 54px); }
  .workspace-head { display: grid; grid-template-columns: 1fr 460px; gap: clamp(32px, 5vw, 70px); align-items: center; }
  .workspace-head h1 { margin: 0 0 18px; font-size: clamp(40px, 6vw, 68px); line-height: 1; }
  .workspace-deck { max-width: 610px; margin: 0; color: var(--ink-2); font-size: clamp(16px, 2.2vw, 18px); line-height: 1.6; }
  .plan-bar { display: flex; justify-content: space-between; align-items: center; gap: 20px; border-top: 1px solid var(--line); border-bottom: 1px solid var(--line); padding: 15px 0; }
  .plan-id { display: flex; align-items: center; gap: 12px; }
  .plan-id > div { display: grid; gap: 2px; }
  .plan-id small { color: var(--ink-4); font-size: 9px; font-weight: 800; letter-spacing: .1em; text-transform: uppercase; }
  .workspace-section { border: 1px solid var(--line); background: #fff; padding: clamp(22px, 3vw, 28px); }
  .location-form { display: grid; grid-template-columns: 1fr 80px 120px; gap: 14px; border: 1px solid var(--line); background: var(--paper-2); padding: clamp(20px, 3vw, 28px); }
  .location-form-head, .location-form > button, .location-form .error { grid-column: 1 / -1; }
  .location-form-head { margin-bottom: 2px; }
  .location-form-head h2 { margin: 0; font-size: 26px; }
  label { color: var(--ink-2); font-size: 12px; font-weight: 800; }
  label input, label textarea, label select { width: 100%; margin-top: 7px; border: 1px solid var(--line-strong); border-radius: 3px; padding: 11px; background: #fff; color: var(--ink); }
  .location-list { display: grid; }
  .location-row { display: flex; justify-content: space-between; gap: 24px; align-items: center; border-top: 1px solid var(--line-soft); padding: 22px 0; }
  .location-row:first-child { border-top: 0; }
  .location-id h3 { margin: 6px 0 6px; font-size: clamp(22px, 3vw, 30px); }
  .location-count { margin: 0; color: var(--ink-3); }
  .location-actions { display: flex; gap: 10px; flex: none; }
  .empty-state { padding: 40px 0 16px; color: var(--ink-3); }
  .empty-state h3 { margin: 0 0 6px; font-size: 22px; }
  .brief-list { display: grid; gap: 0; }
  .brief-row { display: grid; grid-template-columns: 1fr auto; gap: 18px; align-items: center; border-top: 1px solid var(--line-soft); }
  .brief-row:first-child { border-top: 0; }
  .brief-open { display: flex; justify-content: space-between; gap: 20px; align-items: center; border: 0; background: transparent; color: var(--ink); padding: 18px 0; text-align: left; }
  .brief-title { font-family: var(--serif); font-size: 18px; }
  .brief-open small { color: var(--ink-4); font-variant-numeric: tabular-nums; }
  .brief-open:hover .brief-title { color: var(--green); }

  /* Magazine library + publisher studio (workspace) */
  .publisher-studio { border-color: var(--green-700); border-top: 3px solid var(--green-700); background: #fbfcfd; }
  .studio-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; border-top: 1px solid var(--line); border-bottom: 1px solid var(--line); padding: 20px 0; margin-bottom: 8px; }
  .issue-list { display: grid; }
  .issue-row { display: flex; justify-content: space-between; gap: 24px; align-items: center; border: 0; border-top: 1px solid var(--line-soft); background: transparent; color: var(--ink); padding: 18px 0; text-align: left; }
  .issue-row:first-child { border-top: 0; }
  .issue-meta { display: grid; gap: 5px; }
  .issue-meta strong { font-family: var(--serif); font-size: 22px; font-weight: 600; }
  .issue-meta em { color: var(--ink-3); font-size: 13px; font-style: normal; }
  .issue-row:hover .issue-meta strong { color: var(--green); }
  .issue-row time { color: var(--ink-4); font-size: 12px; font-variant-numeric: tabular-nums; flex: none; }
  .status-pill { display: inline-block; width: max-content; padding: 3px 9px; border-radius: 999px; font-size: 9px; font-style: normal; font-weight: 900; letter-spacing: .12em; text-transform: uppercase; }
  .status-draft { background: #ece3cf; color: #7a5a12; }
  .status-review { background: #d9e4ef; color: #285079; }
  .status-published { background: #d6efde; color: #156a3f; }
  .status-approved { background: #d6efde; color: #156a3f; }

  /* Brief page */
  .brief-page { display: grid; gap: clamp(32px, 4vw, 48px); }
  .brief-masthead { border-top: 4px solid var(--green); padding-top: 26px; }
  .brief-masthead h1 { margin: 8px 0 18px; font-size: clamp(34px, 5vw, 60px); line-height: 1.02; }
  .brief-lede { max-width: 760px; color: var(--ink-2); font-size: clamp(16px, 2.2vw, 20px); line-height: 1.6; }
  .brief-stats { display: flex; flex-wrap: wrap; gap: clamp(24px, 5vw, 56px); border-top: 1px solid var(--line); margin-top: 26px; padding-top: 22px; }
  .outlook { max-width: 820px; border-top: 1px solid var(--line); margin-top: 24px; padding-top: 18px; }
  .outlook > strong { color: var(--green); font-size: 11px; font-weight: 900; letter-spacing: .12em; text-transform: uppercase; }
  .outlook p { margin: 8px 0 0; color: var(--ink-2); line-height: 1.6; }
  .brief-section > .kicker { margin-bottom: 16px; }
  .brief-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0; }
  .two-column { display: grid; grid-template-columns: 1fr 1fr; gap: 0; }
  .brief-cell { border: 1px solid var(--line); margin: -1px 0 0 -1px; padding: 24px; background: #fff; }
  .brief-item { border-top: 1px solid var(--line-soft); padding-top: 16px; margin-top: 16px; }
  .brief-cell > .brief-item:first-of-type { border-top: 0; padding-top: 0; margin-top: 0; }
  .brief-item h3 { margin: 0 0 6px; font-size: 20px; }
  .brief-item p { color: var(--ink-2); line-height: 1.55; margin: 0 0 6px; }
  .brief-copy { color: var(--ink-3); white-space: pre-wrap; line-height: 1.55; }
  .score-meters { margin-top: 10px; }
  .tag-row { display: flex; flex-wrap: wrap; gap: 6px; list-style: none; margin: 10px 0 0; padding: 0; }
  .tag-row li { background: var(--paper-3); color: var(--ink-2); font-size: 11px; font-weight: 700; padding: 4px 9px; border-radius: 3px; }
  .mitigation { margin-top: 8px; color: var(--ink-2); font-size: 13px; }
  .mitigation strong { color: var(--green); }
  .swot-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0; }
  .swot-cell { border: 1px solid var(--line); margin: -1px 0 0 -1px; padding: 22px; background: #fff; }
  .swot-cell ul { margin: 0; padding-left: 18px; display: grid; gap: 8px; }
  .swot-cell li { color: var(--ink-2); line-height: 1.45; }
  .swot-up { border-top: 3px solid var(--up); }
  .swot-down { border-top: 3px solid var(--down); }

  /* Magazine reader */
  .magazine-page { min-height: 100vh; padding: 24px var(--gutter) 90px; }
  .studio-toolbar { position: sticky; top: 134px; z-index: 15; display: flex; justify-content: space-between; align-items: center; gap: 16px; flex-wrap: wrap; max-width: 1180px; margin: 0 auto 24px; border: 1px solid var(--line); border-radius: var(--r); background: rgba(243,244,241,.97); backdrop-filter: blur(6px); padding: 12px 16px; }
  .studio-toolbar.studio-mode { background: var(--green-deep); border-color: var(--green-800); }
  .studio-toolbar.studio-mode .text-button { color: var(--lime-soft); }
  .toolbar-left, .toolbar-right { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
  .toolbar-msg { color: var(--green); font-size: 12px; font-weight: 800; }
  .studio-mode .toolbar-msg { color: var(--lime); }
  .studio-flag { background: var(--lime); color: #17303d; padding: 3px 9px; border-radius: 3px; font-size: 9px; font-weight: 900; letter-spacing: .12em; text-transform: uppercase; }

  .magazine-edition { max-width: 980px; margin: auto; background: #fff; box-shadow: 0 24px 70px rgba(19,32,25,.12); }
  .magazine-cover { background: var(--green-deep); color: #fff; }
  .cover-frame { min-height: 1040px; display: grid; grid-template-rows: auto 1fr auto auto; gap: 30px; padding: clamp(32px, 5vw, 56px); }
  .cover-top { display: flex; justify-content: space-between; align-items: center; }
  .magazine-brand { font-weight: 900; letter-spacing: .08em; }
  .magazine-brand span { color: var(--lime); }
  .cover-edition { color: #b9d2dd; font-size: 11px; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; }
  .cover-asset { align-self: stretch; display: grid; place-content: center; gap: 10px; justify-items: center; border: 1px solid #315c72; background: linear-gradient(0deg, rgba(255,255,255,.02), rgba(255,255,255,.02)); }
  .cover-asset-mark { font-family: var(--serif); font-size: clamp(60px, 14vw, 130px); font-weight: 600; color: #2f637e; letter-spacing: .04em; }
  .cover-asset-note { color: #789fb2; font-size: 11px; font-weight: 800; letter-spacing: .14em; text-transform: uppercase; }
  .cover-headline { max-width: 780px; }
  .cover-headline h1 { margin: 12px 0 16px; font-size: clamp(48px, 9vw, 86px); line-height: .92; }
  .cover-headline h2 { margin: 0 0 14px; color: var(--lime); font-family: var(--sans); font-size: clamp(18px, 2.6vw, 22px); font-weight: 700; }
  .cover-dek { max-width: 660px; margin: 0; color: #d6e8f0; font-size: clamp(16px, 2.4vw, 19px); line-height: 1.55; }
  .cover-foot { border-top: 1px solid #54798b; padding-top: 16px; color: #afc8d3; font-size: 10px; font-weight: 800; letter-spacing: .14em; text-transform: uppercase; }

  .magazine-contents { padding: clamp(40px, 6vw, 64px) clamp(34px, 6vw, 72px); border-bottom: 1px solid var(--line); }
  .toc { list-style: none; margin: 18px 0 0; padding: 0; display: grid; gap: 0; }
  .toc li { display: grid; grid-template-columns: 56px 1fr; gap: 16px; align-items: baseline; border-top: 1px solid var(--line-soft); padding: 16px 0; }
  .toc-num { font-family: var(--serif); font-size: 22px; color: var(--ink-4); font-variant-numeric: tabular-nums; }
  .toc-body { display: grid; gap: 3px; }
  .toc-body strong { font-family: var(--serif); font-size: 20px; font-weight: 600; }
  .toc-body em { color: var(--green); font-style: normal; font-size: 11px; font-weight: 800; letter-spacing: .1em; text-transform: uppercase; }

  .editor-note { background: var(--paper-3); padding: clamp(44px, 6vw, 70px) clamp(34px, 6vw, 72px); }
  .editor-note h2 { margin: 0 0 18px; font-size: clamp(30px, 4vw, 48px); }
  .editor-note > p:not(.kicker) { max-width: 70ch; color: var(--ink-2); font-family: var(--serif); font-size: 18px; line-height: 1.75; }
  .editor-sign { margin-top: 18px; color: var(--green); font-weight: 700; }

  .section-opener { display: grid; gap: 4px; padding: clamp(44px, 6vw, 70px) clamp(34px, 6vw, 72px); background: var(--green-deep); color: #fff; border-top: 1px solid var(--green-800); }
  .section-opener .kicker { color: var(--lime-soft); }
  .section-opener-num { font-family: var(--serif); font-size: 48px; color: #315c72; line-height: 1; }
  .section-opener h2 { margin: 4px 0 0; color: #fff; font-size: clamp(32px, 5vw, 56px); }

  .magazine-article { padding: clamp(44px, 6vw, 70px) clamp(34px, 6vw, 72px); border-top: 1px solid var(--line); }
  .magazine-block:first-of-type .magazine-article { border-top: 0; }
  .article-head { margin-bottom: 30px; }
  .article-head h2 { max-width: 18ch; margin: 10px 0 14px; font-size: clamp(34px, 5vw, 56px); line-height: 1.02; }
  .is-lead .article-head h2 { font-size: clamp(40px, 7vw, 68px); }
  .article-head h3 { max-width: 60ch; color: var(--ink-3); font-family: var(--sans); font-size: clamp(16px, 2.2vw, 19px); font-weight: 500; line-height: 1.5; }
  .byline { margin: 14px 0 0; color: var(--green); font-size: 11px; font-weight: 900; letter-spacing: .08em; text-transform: uppercase; }
  .article-body { max-width: 70ch; }
  .is-lead .article-body { columns: 2; column-gap: 40px; max-width: none; }
  .is-lead .article-body > * { break-inside: avoid; }
  .article-body p { margin: 0 0 18px; color: #2d3940; font-family: var(--serif); font-size: 18px; line-height: 1.75; }
  .is-lead .article-body p { font-size: 16px; }
  .quote-wrap { break-inside: avoid; }
  .pull-quote { float: right; width: 44%; margin: 6px 0 22px 36px; border-top: 4px solid var(--green); border-bottom: 1px solid var(--line-strong); padding: 18px 0; color: var(--green); font-family: var(--serif); font-size: clamp(22px, 3vw, 29px); line-height: 1.2; }
  .stat-callout { break-inside: avoid; margin: 0 0 22px; border-left: 4px solid var(--lime); background: var(--paper-3); padding: 18px 22px; }
  .stat-callout strong { display: block; font-family: var(--serif); font-size: clamp(28px, 4vw, 40px); color: var(--green); line-height: 1.1; }
  .article-source { clear: both; border-top: 1px solid var(--line-soft); margin-top: 36px; padding-top: 14px; color: var(--ink-4); font-size: 10px; letter-spacing: .08em; text-transform: uppercase; }

  /* Publisher editor */
  .magazine-editor { display: grid; gap: 18px; max-width: 980px; margin: auto; }
  .magazine-editor > .article-editor, .editor-fields, .editor-heading { border: 1px solid var(--line); background: #fff; padding: 22px; }
  .editor-heading { display: flex; justify-content: space-between; align-items: flex-end; gap: 24px; }
  .editor-heading h1 { margin: 0; font-size: clamp(34px, 5vw, 52px); }
  .editor-status { min-width: 170px; }
  .editor-fields { display: grid; gap: 16px; }
  .magazine-editor label { display: grid; gap: 8px; }
  .magazine-editor input, .magazine-editor textarea, .magazine-editor select { width: 100%; border: 1px solid var(--line-strong); border-radius: 3px; background: var(--paper-2); padding: 11px; color: var(--ink); line-height: 1.55; }
  .magazine-editor textarea { font-family: var(--serif); }
  .article-editor { display: grid; gap: 14px; }
  .article-editor-head h2 { margin: 0; font-size: clamp(24px, 3vw, 32px); }
  .editor-grid { display: grid; grid-template-columns: 1fr 200px; gap: 14px; }


  /* Editorial homepage */
  .editorial-home { background: var(--paper); }
  .editorial-lead-band { max-width: var(--maxw); display: grid; grid-template-columns: 1.08fr .92fr; min-height: 430px; margin: 0 auto; padding: 28px var(--gutter) 34px; }
  .editorial-lead-copy { display: flex; flex-direction: column; justify-content: flex-end; background: var(--green-deep); color: #fff; padding: clamp(28px, 5vw, 54px); }
  .publication-line { position: absolute; align-self: flex-start; margin: 0; transform: translateY(calc(-1 * clamp(300px, 28vw, 345px))); color: #b9d2dd; font-size: 10px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; }
  .editorial-lead-copy h1 { max-width: 790px; margin: 4px 0 18px; font-size: clamp(38px, 6vw, 68px); line-height: .98; }
  .editorial-lead-copy > p:not(.kicker):not(.publication-line) { max-width: 64ch; margin-bottom: 24px; color: #d7eaf2; font-size: 17px; line-height: 1.55; }
  .editorial-lead-meta { display: flex; flex-wrap: wrap; gap: 8px 22px; border-top: 1px solid #54798b; padding-top: 16px; color: #b9d2dd; font-size: 10px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; }
  .editorial-lead-visual { display: flex; flex-direction: column; justify-content: center; border: 1px solid var(--line-strong); border-left: 0; background: var(--paper-2); padding: clamp(28px, 5vw, 48px); }
  .visual-heading { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 3px solid var(--ink); margin-bottom: 24px; padding-bottom: 12px; }
  .visual-heading span { max-width: 150px; font-size: 11px; font-weight: 900; letter-spacing: .1em; text-transform: uppercase; }
  .visual-heading strong { color: var(--green); font-family: var(--serif); font-size: 72px; line-height: .78; }
  .editorial-lead-visual > p { border-top: 1px solid var(--line); margin: 24px 0 0; padding-top: 12px; color: var(--ink-4); font-size: 10px; }

  .briefing-ribbon { max-width: var(--maxw); display: flex; justify-content: space-between; align-items: center; gap: 28px; margin: 0 auto; border-top: 1px solid var(--ink); border-bottom: 1px solid var(--ink); padding: 15px var(--gutter); background: var(--paper-2); }
  .briefing-ribbon div { display: flex; align-items: baseline; gap: 18px; }
  .briefing-ribbon strong { font-family: var(--serif); font-size: 20px; }
  .briefing-ribbon span { color: var(--ink-3); font-size: 12px; }
  .briefing-ribbon a { font-size: 11px; font-weight: 900; text-transform: uppercase; }

  .editorial-section { max-width: var(--maxw); margin: 0 auto; padding: 52px var(--gutter); }
  .editorial-section-head { display: flex; justify-content: space-between; align-items: baseline; gap: 24px; border-top: 3px solid var(--ink); border-bottom: 1px solid var(--ink); margin-bottom: 22px; padding: 9px 0 8px; }
  .editorial-section-head h2 { margin: 0; font-size: 22px; }
  .editorial-section-head span { color: var(--ink-3); font-size: 10px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; }
  .story-label { margin: 0 0 8px; color: var(--green); font-size: 9px; font-weight: 900; letter-spacing: .1em; text-transform: uppercase; }

  .editorial-news-grid { display: grid; grid-template-columns: 1.05fr 1.45fr; gap: 18px; }
  .editorial-feature { display: flex; flex-direction: column; background: var(--green-800); color: #fff; }
  .editorial-feature > p, .editorial-feature > h3, .editorial-feature > footer { margin-left: 24px; margin-right: 24px; }
  .editorial-feature h3 { margin-top: 0; margin-bottom: 12px; font-size: clamp(28px, 4vw, 42px); line-height: 1.02; }
  .editorial-feature > p:not(.story-label) { color: #d7eaf2; line-height: 1.55; }
  .editorial-feature .story-label { margin-top: 20px; color: var(--lime-soft); }
  .editorial-feature footer, .editorial-story footer { display: flex; justify-content: space-between; gap: 12px; border-top: 1px solid rgba(255,255,255,.22); margin-top: auto; padding: 15px 0 20px; color: #b9d2dd; font-size: 9px; font-weight: 800; text-transform: uppercase; }
  .feature-visual { height: 230px; display: grid; grid-template-columns: auto 1fr; align-items: end; gap: 28px; background: var(--green-deep); padding: 26px; }
  .feature-index { display: grid; }
  .feature-index span { color: var(--lime-soft); font-size: 9px; font-weight: 900; letter-spacing: .1em; text-transform: uppercase; }
  .feature-index strong { color: var(--lime); font-family: var(--serif); font-size: 82px; line-height: .9; }
  .feature-bars { height: 150px; display: flex; align-items: end; gap: 8px; }
  .feature-bars i { flex: 1; min-width: 5px; background: var(--lime); opacity: .28; }
  .feature-bars i:nth-child(2n) { opacity: .72; }
  .editorial-story-grid { display: grid; grid-template-columns: 1fr 1fr; border-top: 1px solid var(--line-strong); border-left: 1px solid var(--line-strong); }
  .editorial-story { min-height: 320px; display: flex; flex-direction: column; border-right: 1px solid var(--line-strong); border-bottom: 1px solid var(--line-strong); background: var(--paper-2); padding: 18px; }
  .editorial-story h3 { margin: 0 0 10px; font-size: 22px; line-height: 1.08; }
  .editorial-story > p:not(.story-label) { color: var(--ink-3); font-size: 12px; line-height: 1.5; }
  .editorial-story footer { border-color: var(--line); color: var(--ink-4); padding-bottom: 0; }
  .story-marker { height: 92px; display: grid; place-items: end start; margin: -18px -18px 16px; background: var(--paper-3); padding: 14px 18px; }
  .story-marker span { color: var(--green); font-family: var(--serif); font-size: 44px; }
  .marker-2, .marker-4 { background: var(--lime-soft); }
  .marker-2 span, .marker-4 span { color: var(--green-800); }

  .analysis-desk { padding-top: 28px; }
  .analysis-desk-grid { display: grid; grid-template-columns: 1.2fr .72fr .58fr; gap: 22px; }
  .analysis-main { border-right: 1px solid var(--line); padding-right: 24px; }
  .analysis-main h3 { max-width: 18ch; margin: 0 0 12px; font-size: clamp(28px, 4vw, 42px); line-height: 1.04; }
  .analysis-main > p:not(.story-label) { max-width: 64ch; color: var(--ink-3); line-height: 1.6; }
  .analysis-index { border-right: 1px solid var(--line); padding-right: 22px; }
  .analysis-index .panel-eyebrow { margin-top: 0; }
  .analysis-index .panel-foot { color: var(--ink-4); font-size: 10px; }
  .analysis-rail { display: grid; align-content: start; }
  .analysis-rail article { border-bottom: 1px solid var(--line); padding: 0 0 20px; margin-bottom: 20px; }
  .analysis-rail h3 { margin: 0 0 12px; font-size: 18px; line-height: 1.12; }
  .analysis-rail span { color: var(--ink-4); font-size: 10px; }

  .research-grid { display: grid; grid-template-columns: repeat(4, 1fr); margin-top: 38px; border-top: 1px solid var(--line-strong); border-left: 1px solid var(--line-strong); }
  .research-grid article { min-height: 290px; border-right: 1px solid var(--line-strong); border-bottom: 1px solid var(--line-strong); background: var(--paper-2); padding: 18px; }
  .research-number { color: var(--ink-4); font-family: var(--serif); font-size: 26px; }
  .research-grid h3 { margin: 34px 0 10px; font-size: 19px; line-height: 1.12; }
  .research-grid article > p:not(.story-label) { color: var(--ink-3); font-size: 12px; line-height: 1.5; }
  .research-grid footer { margin-top: 18px; color: var(--ink-4); font-size: 9px; }

  .research-list { border-top: 1px solid var(--line); }
  .research-list article { display: grid; grid-template-columns: 80px 1fr 52px; gap: 20px; align-items: start; border-bottom: 1px solid var(--line); padding: 18px 0; }
  .research-list article > span { display: grid; color: var(--ink-4); font-family: var(--serif); font-size: 22px; }
  .research-list article small { font-family: var(--sans); font-size: 8px; font-weight: 900; letter-spacing: .1em; text-transform: uppercase; }
  .research-list h3 { margin: 0 0 6px; font-size: 19px; }
  .research-list p { max-width: 78ch; margin: 0; color: var(--ink-3); font-size: 12px; line-height: 1.5; }
  .research-list article > strong { color: var(--green); font-family: var(--serif); font-size: 28px; text-align: right; }

  .collection-grid { display: grid; grid-template-columns: repeat(5, 1fr); border: 1px solid var(--line-strong); }
  .collection-grid article { min-height: 150px; border-right: 1px solid var(--line-strong); padding: 18px; background: var(--paper-2); }
  .collection-grid article:last-child { border-right: 0; }
  .collection-grid span { color: var(--green); font-family: var(--serif); font-size: 26px; }
  .collection-grid h3 { margin: 28px 0 6px; font-size: 18px; }
  .collection-grid p { color: var(--ink-4); font-size: 10px; line-height: 1.4; }

  .editorial-footer { display: grid; grid-template-columns: 1.5fr repeat(3, 1fr); gap: 34px; background: var(--green-900); color: #fff; padding: 48px max(var(--gutter), calc((100vw - var(--maxw)) / 2)); }
  .footer-brand strong { font-size: 20px; letter-spacing: .06em; }
  .footer-brand strong span { color: var(--lime); }
  .footer-brand p { max-width: 300px; margin-top: 14px; color: #b9d2dd; font-size: 12px; line-height: 1.5; }
  .editorial-footer h3 { margin: 0 0 15px; color: var(--lime-soft); font-family: var(--sans); font-size: 10px; letter-spacing: .1em; text-transform: uppercase; }
  .editorial-footer > div:not(.footer-brand) { display: grid; align-content: start; gap: 8px; }
  .editorial-footer > div:not(.footer-brand) span { color: #d7eaf2; font-size: 11px; }
  .editorial-footer > small { grid-column: 1 / -1; border-top: 1px solid #54798b; padding-top: 18px; color: #89a8b7; font-size: 9px; }

  @media (max-width: 900px) {
    .editorial-lead-band, .editorial-news-grid, .analysis-desk-grid { grid-template-columns: 1fr; }
    .editorial-lead-visual { border-left: 1px solid var(--line-strong); }
    .publication-line { position: static; transform: none; margin-bottom: 28px; }
    .analysis-main, .analysis-index { border-right: 0; border-bottom: 1px solid var(--line); padding: 0 0 24px; }
    .research-grid { grid-template-columns: 1fr 1fr; }
    .collection-grid { grid-template-columns: 1fr 1fr; }
    .collection-grid article { border-bottom: 1px solid var(--line-strong); }
    .editorial-footer { grid-template-columns: 1fr 1fr; }
  }
  @media (max-width: 560px) {
    .editorial-lead-band { padding: 16px var(--gutter) 24px; }
    .briefing-ribbon, .briefing-ribbon div, .editorial-section-head { align-items: flex-start; flex-direction: column; }
    .editorial-story-grid, .research-grid, .collection-grid { grid-template-columns: 1fr; }
    .editorial-story { min-height: auto; }
    .research-list article { grid-template-columns: 48px 1fr; }
    .research-list article > strong { display: none; }
    .editorial-footer { grid-template-columns: 1fr; }
    .editorial-footer > small { grid-column: auto; }
  }

  /* News front page */
  .news-masthead { max-width: var(--maxw); margin: 0 auto; padding: 22px var(--gutter) 0; }
  .news-masthead-row { display: flex; justify-content: space-between; align-items: baseline; gap: 18px; border-bottom: 3px solid var(--ink); padding-bottom: 12px; }
  .news-edition { margin: 0; font-family: var(--serif); font-size: clamp(17px, 2.6vw, 24px); font-weight: 600; }
  .news-dateline { margin: 0; color: var(--ink-3); font-size: 12px; font-weight: 700; letter-spacing: .03em; }

  .news-lead { max-width: var(--maxw); display: grid; grid-template-columns: 1.55fr .95fr; gap: clamp(24px, 4vw, 48px); margin: 0 auto; padding: clamp(28px, 4vw, 44px) var(--gutter); border-bottom: 1px solid var(--ink); }
  .news-lead-main { min-width: 0; }
  .news-lead-main h1 { margin: 8px 0 14px; font-size: clamp(40px, 7vw, 78px); line-height: .96; }
  .news-lead-dek { max-width: 26ch; margin: 0 0 20px; font-family: var(--serif); font-size: clamp(19px, 2.8vw, 27px); font-style: italic; color: var(--ink-2); line-height: 1.28; }
  .news-lead-standfirst { max-width: 62ch; margin: 0 0 22px; color: var(--ink-2); font-size: clamp(16px, 2.2vw, 18px); line-height: 1.65; }
  .news-byline { display: flex; flex-wrap: wrap; gap: 6px 20px; margin-bottom: 24px; color: var(--ink-3); font-size: 11px; font-weight: 800; letter-spacing: .06em; text-transform: uppercase; }
  .news-byline span + span { position: relative; padding-left: 20px; }
  .news-byline span + span::before { content: "·"; position: absolute; left: 6px; color: var(--ink-4); }
  .news-lead-aside { display: grid; align-content: start; gap: 18px; border-left: 1px solid var(--line); padding-left: clamp(20px, 3vw, 40px); }
  .news-lead-figure { display: grid; align-content: center; justify-items: center; gap: 12px; min-height: 230px; text-align: center; background: var(--green-deep); color: #fff; padding: 30px; }
  .news-lead-figure-kicker { color: var(--lime-soft); font-size: 10px; font-weight: 900; letter-spacing: .16em; text-transform: uppercase; }
  .news-lead-figure-mark { font-family: var(--serif); font-size: clamp(28px, 5vw, 44px); font-weight: 600; color: var(--lime); letter-spacing: .01em; line-height: 1; }
  .news-lead-figure-note { color: #b9d2dd; font-size: 10px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; }
  .news-lead-quote { margin: 0; border-top: 3px solid var(--green); padding-top: 16px; }
  .news-lead-quote p { margin: 0 0 8px; font-family: var(--serif); font-size: clamp(18px, 2.4vw, 22px); font-style: italic; line-height: 1.3; color: var(--ink); }
  .news-lead-quote cite { color: var(--ink-3); font-size: 12px; font-style: normal; font-weight: 700; }

  .news-grid { display: grid; grid-template-columns: repeat(3, 1fr); border-top: 1px solid var(--line-strong); border-left: 1px solid var(--line-strong); }
  .news-card { display: flex; flex-direction: column; min-height: 230px; border-right: 1px solid var(--line-strong); border-bottom: 1px solid var(--line-strong); background: var(--paper-2); padding: 22px; }
  .news-card h3 { margin: 0 0 10px; font-size: clamp(20px, 2.4vw, 26px); line-height: 1.1; }
  .news-card-dek { flex: 1; margin: 0 0 16px; color: var(--ink-3); font-size: 14px; line-height: 1.55; }
  .news-card footer { display: flex; justify-content: space-between; align-items: center; gap: 12px; border-top: 1px solid var(--line); padding-top: 14px; }
  .news-card footer time { color: var(--ink-4); font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .04em; }
  .news-card.is-upcoming { background: var(--paper); }
  .news-card.is-upcoming h3 { color: var(--ink-2); }
  .news-flag { background: var(--paper-3); color: var(--ink-3); font-size: 9px; font-weight: 900; letter-spacing: .1em; text-transform: uppercase; padding: 4px 9px; border-radius: 3px; }

  .service-showcase .service-grid { display: grid; grid-template-columns: 1.5fr .9fr; gap: clamp(24px, 4vw, 44px); }
  .service-copy { border-right: 1px solid var(--line); padding-right: clamp(20px, 3vw, 36px); }
  .service-copy h3 { max-width: 20ch; margin: 0 0 14px; font-size: clamp(24px, 3.4vw, 36px); line-height: 1.06; }
  .service-copy > p:not(.kicker) { max-width: 60ch; margin: 0 0 24px; color: var(--ink-3); line-height: 1.6; }
  .service-index .panel-eyebrow { margin: 0 0 16px; color: var(--green); }
  .service-index .panel-foot { margin: 16px 0 0; color: var(--ink-4); font-size: 11px; }

  /* News article reader */
  .article-page { min-height: 100vh; padding: 24px var(--gutter) 90px; }
  .article-toolbar { display: flex; justify-content: space-between; align-items: center; gap: 16px; max-width: 760px; margin: 0 auto 26px; }
  .article-reader { max-width: 760px; margin: 0 auto; }
  .article-masthead { border-top: 4px solid var(--green); padding-top: 22px; margin-bottom: 26px; }
  .article-masthead h1 { margin: 10px 0 16px; font-size: clamp(36px, 6vw, 60px); line-height: 1.02; }
  .article-dek { margin: 0 0 20px; font-family: var(--serif); font-size: clamp(20px, 3vw, 27px); font-style: italic; color: var(--ink-2); line-height: 1.3; }
  .article-standfirst { margin: 0 0 18px; color: var(--ink-3); font-size: 12px; font-weight: 800; letter-spacing: .06em; text-transform: uppercase; }
  .article-byline { display: flex; flex-wrap: wrap; gap: 6px 20px; border-top: 1px solid var(--line); border-bottom: 1px solid var(--line); padding: 14px 0; color: var(--ink-3); font-size: 11px; font-weight: 800; letter-spacing: .06em; text-transform: uppercase; }
  .article-byline span + span { position: relative; padding-left: 20px; }
  .article-byline span + span::before { content: "·"; position: absolute; left: 6px; color: var(--ink-4); }
  .article-epigraph { max-width: 58ch; margin: 0 auto 30px; padding: 8px 0; text-align: center; }
  .article-epigraph p { margin: 0 0 8px; font-family: var(--serif); font-size: clamp(18px, 2.6vw, 22px); font-style: italic; color: var(--ink-2); line-height: 1.4; }
  .article-epigraph cite { color: var(--ink-3); font-size: 12px; font-style: normal; font-weight: 700; }
  .prose-section { margin-bottom: 6px; }
  .prose-eyebrow { margin: 38px 0 0; color: var(--green); font-size: 11px; font-weight: 900; letter-spacing: .14em; text-transform: uppercase; }
  .prose-section h2 { margin: 8px 0 16px; font-size: clamp(24px, 3.4vw, 34px); line-height: 1.1; }
  .prose p { margin: 0 0 20px; color: #2d3940; font-family: var(--serif); font-size: 19px; line-height: 1.78; }
  .prose p.has-dropcap::first-letter { float: left; padding: 8px 10px 0 0; color: var(--green); font-family: var(--serif); font-weight: 600; font-size: 4.2em; line-height: .8; }
  .prose-points { margin: 0 0 20px; padding: 0; list-style: none; display: grid; gap: 16px; }
  .prose-points li { border-left: 3px solid var(--lime); padding-left: 16px; color: #2d3940; font-family: var(--serif); font-size: 18px; line-height: 1.7; }
  .prose-points strong { color: var(--ink); }
  .article-sourcenote { border-top: 1px solid var(--line); margin: 36px 0 0; padding-top: 16px; color: var(--ink-4); font-size: 13px; font-style: italic; line-height: 1.6; }
  .article-end { border-top: 1px solid var(--line-soft); margin-top: 30px; padding-top: 20px; }

  /* Editorial figures + charts */
  .fig { margin: 26px 0; break-inside: avoid; }
  .fig-frame { border: 1px solid var(--line); background: #fff; padding: clamp(14px, 2.4vw, 20px); }
  .fig-cap { margin-top: 10px; padding-left: 2px; color: var(--ink-2); font-family: var(--sans); font-size: 12.5px; line-height: 1.45; }
  .fig-cap strong { color: var(--ink); font-weight: 800; }
  .fig-source { display: block; margin-top: 3px; color: var(--ink-4); font-size: 11px; }
  .fig svg { display: block; width: 100%; height: auto; }
  .fig-keynumbers { display: grid; grid-template-columns: repeat(4, 1fr); gap: clamp(14px, 2.4vw, 20px); }
  .fig-keynumbers .key-number { border-left: 3px solid var(--green); padding-left: 13px; }
  .fig-keynumbers .key-number strong { font-size: clamp(26px, 4vw, 38px); }
  .c-grid { stroke: var(--line-soft); stroke-width: 1; }
  .c-axis { stroke: var(--line-strong); stroke-width: 1; }
  .c-label { fill: var(--ink-4); font-family: var(--sans); font-size: 12px; font-weight: 700; }
  .c-axis-title { fill: var(--ink-3); font-family: var(--sans); font-size: 11px; font-weight: 800; letter-spacing: .04em; text-transform: uppercase; }
  .c-value { fill: var(--ink); font-family: var(--sans); font-size: 13px; font-weight: 800; }
  .c-line { fill: none; stroke: var(--green); stroke-width: 2.5; stroke-linejoin: round; stroke-linecap: round; }
  .c-area { fill: var(--green); opacity: .12; }
  .c-dot { fill: var(--green); }
  .c-bar { fill: var(--green); }
  .c-bar-2 { fill: var(--lime); }
  .c-bar-accent { fill: var(--lime); }
  .c-track { fill: var(--paper-3); }
  .c-node { fill: var(--paper-2); stroke: var(--green); stroke-width: 1.3; }
  .c-node-label { fill: var(--ink); font-family: var(--sans); font-size: 13px; font-weight: 700; }
  .c-flow { fill: none; stroke: var(--green); stroke-width: 1.6; }
  .c-arrow { fill: var(--green); }
  .c-water { fill: var(--lime-soft); opacity: .55; }
  .c-land { fill: var(--paper-3); stroke: var(--line-strong); stroke-width: 1; }
  .c-coast { fill: none; stroke: var(--green); stroke-width: 1.4; opacity: .5; }

  /* Front-page hero trend (dark) */
  .hero-trend { margin: 0; background: var(--green-deep); color: #fff; padding: 20px 22px; }
  .hero-trend-head { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; border-bottom: 1px solid #54798b; padding-bottom: 12px; }
  .hero-trend-head span { color: #b9d2dd; font-size: 11px; font-weight: 800; letter-spacing: .04em; text-transform: uppercase; }
  .hero-trend-head strong { color: var(--lime); font-family: var(--serif); font-size: 28px; line-height: 1; }
  .hero-trend svg { display: block; width: 100%; height: auto; margin: 10px 0 4px; }
  .hero-trend-note { margin: 0; color: #b9d2dd; font-size: 11px; line-height: 1.5; }
  .ht-area { fill: var(--lime); opacity: .16; }
  .ht-axis { stroke: #54798b; stroke-width: 1; }
  .ht-line { fill: none; stroke: var(--lime); stroke-width: 2.5; stroke-linecap: round; stroke-linejoin: round; }
  .ht-dot { fill: var(--lime); }
  .ht-val { fill: #fff; font-family: var(--sans); font-size: 12px; font-weight: 800; }
  .ht-tick { fill: #89a8b7; font-family: var(--sans); font-size: 11px; font-weight: 700; }

  @media (max-width: 900px) {
    .news-lead, .service-showcase .service-grid { grid-template-columns: 1fr; }
    .news-lead-aside { border-left: 0; padding-left: 0; }
    .service-copy { border-right: 0; padding-right: 0; border-bottom: 1px solid var(--line); padding-bottom: 24px; }
    .news-grid { grid-template-columns: 1fr 1fr; }
  }
  @media (max-width: 700px) {
    .fig-keynumbers { grid-template-columns: repeat(2, 1fr); }
  }
  @media (max-width: 560px) {
    .news-masthead-row { flex-direction: column; align-items: flex-start; gap: 4px; }
    .news-grid { grid-template-columns: 1fr; }
    .prose p { font-size: 18px; }
  }

  /* Responsive */
  @media (max-width: 1080px) {
    .feed-layout { grid-template-columns: 1fr; }
    .impact-index { border-right: 0; }
  }
  @media (max-width: 900px) {
    .site-header { grid-template-columns: 1fr auto; } nav { display: none; }
    .feed-hero, .workspace-head, .access-band, .pricing-grid { grid-template-columns: 1fr; }
    .feed-grid { grid-template-columns: 1fr; }
    .brief-grid, .two-column, .swot-grid { grid-template-columns: 1fr; }
    .brief-row { grid-template-columns: 1fr; gap: 0; }
    .studio-stats { grid-template-columns: 1fr 1fr; }
    .editor-grid { grid-template-columns: 1fr; }
    .is-lead .article-body { columns: auto; }
    .pull-quote { float: none; width: auto; margin: 24px 0; }
    .studio-toolbar { position: static; }
  }
  @media (max-width: 520px) {
    .market-tape { grid-template-columns: auto minmax(0, 1fr); }
    .market-tape-label { padding: 0 10px; }
    .market-tape-label span, .market-tape > time { display: none; }
    .market-tape-prices .market-tape-track { animation-duration: 42s; }
    .market-tape-news .market-tape-track { animation-duration: 68s; }
    .account-button { padding: 9px 10px; font-size: 11px; } .brand { font-size: 12px; }
    .account-identity small, .signout-button { display: none; }
    .account-identity strong { max-width: 105px; font-size: 12px; }
    .workspace-head { gap: 26px; }
    .location-row, .location-actions { display: grid; }
    .location-actions { grid-template-columns: 1fr; gap: 8px; }
    .input-row { grid-template-columns: 1fr; }
    .input-row input { border-radius: var(--r) var(--r) 0 0; }
    .input-row .btn { border-radius: 0 0 var(--r) var(--r); }
    .studio-stats { grid-template-columns: 1fr; }
    .brief-stats { gap: 22px; }
    .meter { grid-template-columns: 76px 1fr 32px; }
  }

  /* Print / PDF */
  @media print {
    @page { size: letter; margin: .55in; }
    :root { background: #fff; }
    body { background: #fff; }
    .header-stack, .studio-toolbar, .skip-link, .article-toolbar, .article-end { display: none !important; }
    .article-page { padding: 0; }
    .article-reader { max-width: none; }
    .prose p { font-size: 12px; line-height: 1.55; }
    .prose p.has-dropcap::first-letter { font-size: 3.4em; }
    .prose-points li { font-size: 12px; line-height: 1.5; }
    .article-epigraph p { font-size: 16px; }
    .prose-section h2 { break-after: avoid; }
    .fig { break-inside: avoid; margin: 18px 0; }
    .fig svg { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
    .fig-frame { border-color: #bbb; }
    .magazine-page { padding: 0; }
    .magazine-edition { max-width: none; box-shadow: none; }
    .magazine-cover { break-after: page; print-color-adjust: exact; -webkit-print-color-adjust: exact; }
    .cover-frame { min-height: 9.4in; }
    .magazine-contents { break-after: page; }
    .editor-note { break-after: page; print-color-adjust: exact; -webkit-print-color-adjust: exact; }
    .section-opener { break-before: page; print-color-adjust: exact; -webkit-print-color-adjust: exact; }
    .magazine-block { break-before: page; }
    .magazine-block:first-of-type { break-before: auto; }
    .magazine-article { padding: 0; border: 0; }
    .article-head h2, .is-lead .article-head h2 { font-size: 38px; }
    .article-body, .is-lead .article-body { columns: auto; max-width: none; }
    .article-body p, .is-lead .article-body p { font-size: 12px; line-height: 1.55; }
    .pull-quote { font-size: 20px; }
    .stat-callout strong { font-size: 26px; }
  }
  @media (prefers-reduced-motion: reduce) {
    .market-tape-window.is-moving .market-tape-track { animation: none; }
    .market-tape-window { overflow-x: auto; }
    .loading-bar { animation: none; }
    .btn:active { transform: none; }
  }
`;
