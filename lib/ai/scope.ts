// The syllabus, quoted by both the grading prompt and the generator.
// Edit here when the lessons change, or the AI grades against the old rules.

export const GRAMMAR_SCOPE = `Present tenses: present continuous (am/is/are + verb-ing), present simple (including he/she/it endings -s/-es/-ies), present perfect (have/has + past participle), present perfect continuous (have/has been + verb-ing).
Past tenses: past simple (regular -ed and irregular forms), past continuous (was/were + verb-ing), past perfect (had + past participle), past perfect continuous (had been + verb-ing).
Future tenses: simple future (will/won't + base verb), future continuous (will be + verb-ing), future perfect (will have + past participle), future perfect continuous (will have been + verb-ing).
Adverbs: manner (quickly, carefully), time (yesterday, soon, now), place (here, outside, everywhere), frequency (always, usually, often, sometimes, never), degree (very, quite, really, too, enough).
Affirmative and negative with do: do/does in statements, and don't/doesn't + base verb.`;

/** Allowed irregulars, so generated content cannot drift into rare forms. */
export const IRREGULAR_VERBS = `be/was-were/been, go/went/gone, eat/ate/eaten, have/had/had, see/saw/seen, do/did/done, write/wrote/written, take/took/taken, make/made/made, come/came/come, give/gave/given, know/knew/known, buy/bought/bought, drink/drank/drunk, sleep/slept/slept, speak/spoke/spoken, forget/forgot/forgotten, meet/met/met, run/ran/run, find/found/found, get/got/got, send/sent/sent, win/won/won, teach/taught/taught, bring/brought/brought, think/thought/thought, leave/left/left, lose/lost/lost, tell/told/told, read/read/read`;

export const OUT_OF_SCOPE = `Do not use: "going to" for the future, question inversion (Do you...? Have you...?), passive voice, conditionals, modal verbs other than will, reported speech, or any irregular verb outside the list above.`;
