# Combined New Question Draft — For Review

Merges my earlier draft (`new_questions_draft.md`) with Claude's draft (`questions_new_unique_draft.md`). All questions converted to MCQ format. ✓ marks the correct answer. Source tags: **[M]** = mine, **[C]** = Claude's draft, **[B]** = both drafts covered the topic (one version kept).

Topics that appeared in both drafts were deduplicated — the better-phrased or more specific version was kept. Near-duplicates on the same concept (e.g. Pythagoras with different numbers) were both retained for variety.

---

## Module 01 — Introductory Maths (10)

1. **[M]** What is log₂(8) equal to? — A) 2  B) 3 ✓  C) 4  D) 8
2. **[B]** Using the log product rule, log(a) + log(b) equals: — A) log(a+b)  B) log(a/b)  C) log(ab) ✓  D) log(a) × log(b)
3. **[C]** Using the log quotient rule, log(a/b) equals: — A) log(a) × log(b)  B) log(a) − log(b) ✓  C) log(a) + log(b)  D) log(a − b)
4. **[M]** In a right-angled triangle, if the two shorter sides are 6 and 8, what is the hypotenuse? — A) 10 ✓  B) 12  C) 14  D) √48
5. **[C]** A right-angled triangle has sides 5 and 12. What is the hypotenuse? — A) 12  B) 13 ✓  C) 17  D) √119
6. **[M]** Which measure describes the spread of the middle 50% of a dataset? — A) Range  B) Variance  C) Standard deviation  D) IQR ✓
7. **[M]** What does a correlation coefficient of 0 indicate? — A) Perfect positive relationship  B) Perfect negative relationship  C) No linear relationship ✓  D) The variables are identical
8. **[M]** For the linear function f(x) = 3x + 5, what is the y-intercept? — A) 3  B) 5 ✓  C) −5  D) 0
9. **[M]** Which trig ratio equals opposite over hypotenuse? — A) cos  B) tan  C) sin ✓  D) cot
10. **[C]** Solve 9x + 3 = −2. — A) x = 5/9  B) x = −5/9 ✓  C) x = −1/3  D) x = −9/5

## Module 02 — Intro Programming (12)

1. **[M]** Which Python data type would you use for True/False values? — A) int  B) str  C) bool ✓  D) None
2. **[C]** Which Python value represents the absence of a value? — A) 0  B) ""  C) False  D) None ✓
3. **[M]** What Python keyword is used to define a function? — A) func  B) def ✓  C) function  D) lambda
4. **[M]** Which Git command uploads local commits to a remote repository? — A) git pull  B) git commit  C) git push ✓  D) git merge
5. **[M]** Which sorting algorithm has worst-case O(n²) but best-case O(n)? — A) Merge sort  B) Bubble sort ✓  C) Quick sort  D) Heap sort
6. **[M]** In Python, what does `len([1,2,3,4])` return? — A) 3  B) 4 ✓  C) [1,2,3,4]  D) Error
7. **[B]** Which OOP principle lets the same method name behave differently in different classes? — A) Encapsulation  B) Inheritance  C) Polymorphism ✓  D) Abstraction
8. **[M]** Which Python statement handles exceptions? — A) if/else  B) try/except ✓  C) for/in  D) catch/throw
9. **[C]** Which Python exception is raised when accessing a list position that does not exist? — A) KeyError  B) ValueError  C) IndexError ✓  D) TypeError
10. **[M]** What does PEP 8 refer to in Python? — A) A package manager  B) Python's official style guide ✓  C) A testing framework  D) A version number
11. **[M]** Which of these is an example of a syntax error? — A) Dividing by zero at runtime  B) Missing closing parenthesis ✓  C) Wrong output from correct code  D) File not found
12. **[M]** What is the main purpose of a unit test? — A) Test the entire system end-to-end  B) Test one small part in isolation ✓  C) Test user acceptance  D) Test network performance

## Module 03 — Foundations of Data Science (12)

1. **[M]** Which distance metric computes straight-line distance between two points? — A) Manhattan  B) Euclidean ✓  C) Hamming  D) Jaccard
2. **[M]** What does the F1 score balance? — A) Accuracy and loss  B) Precision and recall ✓  C) TPR and FPR  D) Bias and variance
3. **[M]** Which scale of measurement has a true zero point and allows ratios? — A) Nominal  B) Ordinal  C) Interval  D) Ratio ✓
4. **[M]** In the confusion matrix, a false positive is also known as: — A) Type I error ✓  B) Type II error  C) True positive  D) True negative
5. **[B]** JSON and XML are best described as which data type? — A) Structured  B) Semi-structured ✓  C) Unstructured  D) Quasi-structured
6. **[M]** What does the Apriori property state? — A) All itemsets are frequent  B) If an itemset is frequent, all its subsets are frequent ✓  C) Confidence always exceeds support  D) Lift is always > 1
7. **[C]** In association rules, what does confidence measure? — A) How often the rule appears overall  B) How often the consequent occurs when the antecedent occurs ✓  C) Whether the rule beats chance  D) The size of the itemset
8. **[M]** Which classifier uses conditional probability with an independence assumption? — A) Decision tree  B) Naive Bayes ✓  C) SVM  D) k-NN
9. **[M]** What does R² represent in regression? — A) Residual standard error  B) Fraction of variance explained by the model ✓  C) Root mean square error  D) Correlation coefficient
10. **[M]** Which unsupervised learning task finds items that frequently co-occur? — A) Classification  B) Clustering  C) Association rule mining ✓  D) Regression
11. **[M]** Which SQL operation combines related tables based on a matching column? — A) UNION  B) JOIN ✓  C) SELECT  D) INSERT
12. **[C]** In the six-phase data-science lifecycle, which phase chooses methods, features, metrics, and evaluation strategy? — A) Discovery  B) Data Preparation  C) Model Planning ✓  D) Model Building

## Module 05 — Systems Analysis & Design (13)

1. **[M]** Which SDLC phase creates an implementable blueprint from analysis? — A) Planning  B) Analysis  C) Design ✓  D) Implementation
2. **[M]** What does BPI stand for in organisational change? — A) Business Process Innovation  B) Business Process Improvement ✓  C) Business Protocol Integration  D) Business Plan Iteration
3. **[M]** In UML class diagrams, which symbol represents a private attribute? — A) `+`  B) `#`  C) `-` ✓  D) `~`
4. **[M]** Which SQL category includes INSERT, UPDATE, and DELETE? — A) DDL  B) DML ✓  C) DQL  D) DCL
5. **[M]** What does the multiplicity notation `1..*` in UML mean? — A) Exactly one  B) Zero or one  C) One or more ✓  D) Zero or many
6. **[M]** In client-server architecture, which tier handles application logic in a 3-tier model? — A) Client/presentation  B) Middle/application ✓  C) Database  D) Network
7. **[M]** Which conversion strategy runs the old and new system simultaneously? — A) Direct  B) Parallel ✓  C) Pilot  D) Phased
8. **[M]** Which testing uses real but monitored data at the customer site? — A) Alpha  B) Beta ✓  C) Unit  D) Integration
9. **[M]** Which UI prototype type has the lowest level of detail? — A) HTML prototype  B) Language prototype  C) Storyboard ✓  D) Functional prototype
10. **[M]** Which feasibility type asks "will the business and users accept the system"? — A) Technical  B) Economic  C) Organisational ✓  D) Schedule
11. **[C]** In a use case diagram, which relationship shows optional behaviour added only in certain conditions? — A) include  B) extend ✓  C) generalization  D) association
12. **[C]** Which requirements-gathering technique is best for seeing how users actually perform their work? — A) Questionnaire  B) JAD  C) Observation ✓  D) Document analysis
13. **[C]** Which client type keeps most application logic on the server side? — A) Thick client  B) Thin client ✓  C) Hybrid client  D) Peer client

## Module 06 — LSEP (11)

1. **[M]** Which legal instrument replaced the earlier UK data protection regime post-Brexit? — A) GDPR only  B) Data Protection Act 2018 ✓  C) Freedom of Information Act  D) Computer Misuse Act
2. **[B]** Which IP form protects a brand name or logo? — A) Copyright  B) Patent  C) Trademark ✓  D) Trade secret
3. **[M]** What is the maximum GDPR fine for a serious breach? — A) £1m or 1% turnover  B) £8.7m or 2% turnover  C) £17.5m or 4% turnover ✓  D) Unlimited
4. **[M]** Which V refers to trustworthiness of data? — A) Volume  B) Velocity  C) Veracity ✓  D) Variety
5. **[M]** Which term describes research done first-hand specifically for the current project? — A) Secondary  B) Tertiary  C) Primary ✓  D) Meta-research
6. **[M]** Which of these is NOT normally protected whistleblowing? — A) Reporting fraud  B) Reporting health and safety risks  C) Personal bullying grievance ✓  D) Reporting environmental harm
7. **[M]** Which GDPR right allows individuals to have personal data deleted? — A) Right to access  B) Right to erasure ✓  C) Right to rectify  D) Right to object
8. **[B]** Which is a warning sign of a predatory journal? — A) Slow peer review  B) Very fast publication with minimal peer review ✓  C) Indexed in Scopus  D) Established editorial board
9. **[M]** Which case study showed racial bias emerging through a poor proxy variable? — A) Equifax breach  B) Healthcare algorithm case ✓  C) Care.data  D) Oracle vs Google
10. **[M]** Which organisation is a well-known IT professional body? — A) BCS ✓  B) WHO  C) UNESCO  D) OECD
11. **[C]** Which GDPR/DPA principle requires personal data to be correct and kept up to date? — A) Data minimisation  B) Accuracy ✓  C) Purpose limitation  D) Storage limitation

## Module 07 — Advanced Systems Programming (11)

1. **[B]** Which cohesion type is the best/most desirable? — A) Coincidental  B) Temporal  C) Functional ✓  D) Logical
2. **[M]** Which coupling type is the worst? — A) Data coupling  B) Stamp coupling  C) Content coupling ✓  D) Control coupling
3. **[C]** Which coupling type exists when modules share global data? — A) Data coupling  B) Common coupling ✓  C) Control coupling  D) Content coupling
4. **[B]** Which RUP phase involves moving the product to its users? — A) Inception  B) Elaboration  C) Construction  D) Transition ✓
5. **[M]** Which UML diagram shows a snapshot of specific objects at one moment in time? — A) Class diagram  B) Object diagram ✓  C) Sequence diagram  D) State diagram
6. **[M]** Which design pattern adds responsibilities to an object dynamically without changing its class? — A) Abstract Factory  B) Decorator ✓  C) Mediator  D) Observer
7. **[M]** What distinguishes a closed from an open layered architecture? — A) Closed is encrypted  B) Closed allows a layer to use only the next immediate layer ✓  C) Open is faster  D) Closed has fewer layers
8. **[M]** In BCED architecture, which layer holds the domain model? — A) Boundary  B) Control  C) Entity ✓  D) Database
9. **[M]** Which sequence diagram fragment represents iteration? — A) opt  B) alt  C) loop ✓  D) par
10. **[M]** What does the Microsoft SDL "secure by default" principle mean? — A) Security features must be manually enabled  B) Default settings should be the most secure option ✓  C) Security is only the user's responsibility  D) Default passwords are mandatory
11. **[M]** Which diagram best shows run-time hardware distribution? — A) Class diagram  B) Component diagram  C) Deployment diagram ✓  D) Activity diagram

## Module 08 — Interpreting Data (11)

1. **[M]** What is the z-score formula? — A) (x − μ) × σ  B) (x − μ) / σ ✓  C) (x + μ) / σ  D) x / (μ − σ)
2. **[M]** Under the 68-95-99.7 rule, what percentage of normal data lies within ±2 SD of the mean? — A) 68%  B) 95% ✓  C) 99.7%  D) 50%
3. **[B]** A Type II error is: — A) Rejecting a true null  B) Failing to reject a false null ✓  C) Setting α too high  D) Using the wrong test
4. **[M]** In ARIMA, the parameter `p` is usually identified from which plot? — A) ACF  B) PACF ✓  C) Scatter plot  D) Histogram
5. **[M]** Which nonparametric test replaces a one-way ANOVA? — A) Wilcoxon signed-rank  B) Mann-Whitney U  C) Kruskal-Wallis ✓  D) Chi-squared
6. **[M]** A Durbin-Watson statistic close to 2 suggests: — A) Strong positive autocorrelation  B) No autocorrelation ✓  C) Strong negative autocorrelation  D) Perfect correlation
7. **[B]** What does a PCA loading plot show? — A) Variance of each PC  B) How strongly original variables contribute to PCs ✓  C) Case positions in PC space  D) Cluster membership
8. **[M]** Which test compares variances rather than means? — A) t-test  B) χ² test ✓  C) ANOVA  D) Z-test
9. **[M]** Which plot is best for showing hierarchical clustering results? — A) Scree plot  B) Dendrogram ✓  C) Box plot  D) ACF
10. **[M]** In the regression equation ŷ = 3 + 2x, what is the slope? — A) 3  B) 2 ✓  C) 5  D) x
11. **[C]** Which plot is usually best for showing the relationship between two numeric variables? — A) Histogram  B) Box plot  C) Scatter plot ✓  D) Bar chart

## Module 09 — Project Management (12)

1. **[B]** Which project type has low certainty about both the goal and the process? — A) Painting-by-numbers  B) Quest  C) Movie  D) Foggy ✓
2. **[M]** Which precedence relationship means a successor cannot start until the predecessor finishes? — A) Start-to-Start  B) Finish-to-Start ✓  C) Finish-to-Finish  D) Start-to-Finish
3. **[M]** In EVM, what does PV stand for? — A) Project Value  B) Planned Value ✓  C) Process Variance  D) Performance Variable
4. **[M]** A programme is best described as: — A) A single project  B) A coordinated collection of related projects ✓  C) A task within a project  D) An activity
5. **[M]** Which process group formally authorises a project or phase? — A) Initiating ✓  B) Planning  C) Executing  D) Closing
6. **[M]** Which cost should NOT influence a decision to continue investment? — A) Direct  B) Indirect  C) Sunk ✓  D) Tangible
7. **[M]** In a projectized organisational structure, the project manager typically has: — A) Low authority  B) High authority ✓  C) No authority  D) Shared authority only
8. **[M]** Which quality tool is best for assessing process stability? — A) Histogram  B) Scatter diagram  C) Control chart ✓  D) Pareto chart
9. **[M]** "Risk appetite" refers to: — A) Number of identified risks  B) Level of risk stakeholders are willing to accept ✓  C) Total cost of risk responses  D) A risk register field
10. **[M]** Which risk management process comes first? — A) Plan risk responses  B) Plan risk management ✓  C) Implement responses  D) Monitor risks
11. **[C]** In schedule networks, what does float (or slack) represent? — A) The earliest start of an activity  B) How much an activity can slip without causing schedule problems ✓  C) The total duration of the project  D) The number of parallel activities
12. **[C]** Which process group is responsible for formal project completion? — A) Initiating  B) Executing  C) Monitoring & controlling  D) Closing ✓

## Module 10 — Machine Learning (12)

1. **[M]** Which CRISP-DM phase involves putting the model into use? — A) Evaluation  B) Modelling  C) Deployment ✓  D) Business understanding
2. **[B]** Which scaling method produces values with mean 0 and standard deviation 1? — A) Min-max  B) Z-score standardisation ✓  C) Log transform  D) One-hot
3. **[M]** Which encoding is best for an ordinal variable like "small/medium/large"? — A) One-hot  B) Ordinal encoding ✓  C) Label shuffle  D) Dummy coding
4. **[M]** In k-means, which method helps choose the best `k`? — A) Confusion matrix  B) Elbow method ✓  C) ROC curve  D) Cross-validation
5. **[M]** Which ensemble method trains base learners sequentially, each focusing on previous mistakes? — A) Bagging  B) Voting  C) Boosting ✓  D) Stacking
6. **[M]** Which activation function is `max(0, x)`? — A) Sigmoid  B) tanh  C) ReLU ✓  D) Softmax
7. **[M]** Which linkage method in hierarchical clustering tends to produce chain-like clusters? — A) Single ✓  B) Complete  C) Average  D) Ward
8. **[M]** What does a silhouette score near 0 indicate about a point? — A) Very well clustered  B) Weak or ambiguous assignment ✓  C) Certainly misclassified  D) Outlier
9. **[M]** Dropout in neural networks is a form of: — A) Activation function  B) Regularisation ✓  C) Optimiser  D) Loss function
10. **[M]** In CART decision trees, which split criterion is used? — A) Entropy only  B) Gini index ✓  C) Chi-squared  D) Information ratio
11. **[C]** Which CRISP-DM phase checks whether the model actually meets the business or research objective? — A) Data understanding  B) Modelling  C) Evaluation ✓  D) Deployment
12. **[C]** Why is it bad practice to keep using the test set while tuning a model? — A) It is slower than cross-validation  B) It leaks evaluation information and gives an optimistically biased performance estimate ✓  C) It changes the random seed  D) It violates normality assumptions

## Module 11 — Information Security (13)

1. **[M]** Which CIA principle is violated by a denial-of-service attack? — A) Confidentiality  B) Integrity  C) Availability ✓  D) Authenticity
2. **[M]** In quantitative risk assessment, ALE equals: — A) SLE × Asset Value  B) SLE × Annualised Rate of Occurrence ✓  C) Exposure Factor × ARO  D) Impact × Likelihood
3. **[M]** Which authentication factor is "something you are"? — A) Password  B) Smart card  C) Fingerprint ✓  D) Location
4. **[M]** Which malware type self-replicates across networks? — A) Trojan  B) Rootkit  C) Worm ✓  D) Spyware
5. **[M]** Which ISO standard covers business continuity management? — A) ISO 27001  B) ISO 27005  C) ISO 22301 ✓  D) ISO 9001
6. **[M]** Which control type restores operations after an incident? — A) Preventive  B) Detective  C) Corrective ✓  D) Compensatory
7. **[M]** Salting a password means: — A) Encrypting it with AES  B) Adding random data before hashing ✓  C) Storing it in plaintext with a prefix  D) Using a longer password
8. **[M]** In the MITM attack family, which is an example? — A) Phishing email  B) Session hijacking ✓  C) Brute-force  D) Ransomware
9. **[M]** Which phishing variant targets a specific individual or organisation? — A) Phishing  B) Vishing  C) Spear-phishing ✓  D) Smishing
10. **[M]** Which attack stage comes first in the lecture's four-stage model? — A) Delivery  B) Survey ✓  C) Breach  D) Affect
11. **[C]** Which part of the CIA triad is about information remaining accurate and unaltered? — A) Confidentiality  B) Integrity ✓  C) Availability  D) Accountability
12. **[C]** What is the difference between authentication and authorisation? — A) They mean the same thing  B) Authentication proves identity; authorisation determines permissions ✓  C) Authentication determines permissions; authorisation proves identity  D) Only authentication applies to users
13. **[C]** What is the main purpose of an asset register? — A) To track employee attendance  B) To document assets, ownership, value, and risk-related details ✓  C) To price software licences  D) To list approved vendors

## Module 12 — Scalable Systems & Databases (11)

1. **[M]** What is the default HDFS block size in Hadoop 2.x/3.x? — A) 32 MB  B) 64 MB  C) 128 MB ✓  D) 256 MB
2. **[M]** Which Spark abstraction is strongly typed at compile time? — A) RDD  B) DataFrame  C) Dataset ✓  D) Row
3. **[M]** Which NoSQL family is MongoDB? — A) Key-value  B) Document ✓  C) Column-family  D) Graph
4. **[M]** According to the slides, Cassandra's CAP posture is: — A) CA  B) CP  C) AP ✓  D) All three
5. **[M]** In MapReduce, which component performs local pre-aggregation to reduce shuffle traffic? — A) Partitioner  B) Combiner ✓  C) Reducer  D) Mapper
6. **[B]** What does BASE stand for in NoSQL? — A) Binary, Atomic, Secure, Eventual  B) Basically Available, Soft State, Eventually Consistent ✓  C) Balanced, Async, Scaled, Elastic  D) Backup, Archive, Store, Export
7. **[M]** In YARN, which component coordinates a single application's execution? — A) ResourceManager  B) NodeManager  C) ApplicationMaster ✓  D) Container
8. **[M]** Which Hive table type keeps its data files when the table is dropped? — A) Managed  B) Internal  C) External ✓  D) Temporary
9. **[M]** Which Spark operation is lazy? — A) count  B) collect  C) map ✓  D) take
10. **[B]** Which tool is best for ingesting streaming logs/events into Hadoop? — A) Sqoop  B) Flume ✓  C) Hive  D) Pig
11. **[C]** In Hadoop, what does data locality mean? — A) Storing data only in one rack  B) Moving computation close to where the data is stored ✓  C) Replicating data across regions  D) Keeping the NameNode near the client

## Module 13 — AI for Data Science (12)

1. **[M]** Which search algorithm is guaranteed optimal when the heuristic is admissible? — A) Greedy  B) DFS  C) A* ✓  D) Hill climbing
2. **[M]** In a genetic algorithm, which operator combines genes from two parents? — A) Mutation  B) Crossover ✓  C) Selection  D) Elitism
3. **[M]** In NLP, what does TF-IDF weight combine? — A) Term frequency and sentence length  B) Term frequency and inverse document frequency ✓  C) Token count and n-gram size  D) Sentiment and frequency
4. **[M]** What is the main purpose of a pooling layer in a CNN? — A) Apply activation  B) Downsample feature maps ✓  C) Classify the output  D) Normalise inputs
5. **[M]** Fuzzy logic allows truth values in: — A) {0, 1} only  B) The interval [0, 1] ✓  C) {−1, 0, 1}  D) Any real number
6. **[M]** In reinforcement learning, the policy is: — A) The reward function  B) The rule for choosing actions ✓  C) The transition model  D) The value estimate
7. **[M]** Which logic family includes quantifiers and objects? — A) Propositional  B) First-order logic ✓  C) Boolean  D) Binary
8. **[M]** In transformer architecture, what provides word-order information? — A) Self-attention  B) Positional encoding ✓  C) Tokenisation  D) Cross-attention
9. **[M]** Which RL component provides scalar feedback to the agent? — A) State  B) Action  C) Reward ✓  D) Policy
10. **[B]** Bag-of-Words representation ignores: — A) Word frequency  B) Word order and syntax ✓  C) Document length  D) Vocabulary size
11. **[C]** Which agent type chooses among alternatives using a utility function? — A) Simple reflex  B) Model-based reflex  C) Goal-based  D) Utility-based ✓
12. **[C]** What is an admissible heuristic? — A) One that always finds the goal  B) A heuristic that never overestimates the true remaining cost ✓  C) A heuristic computed in constant time  D) One that always overestimates cost

## Module 14 — Project Planning (12)

1. **[M]** Which feasibility type asks "can we deliver on time?" — A) Technical  B) Economic  C) Schedule ✓  D) Operational
2. **[M]** In SMART objectives, what does M stand for? — A) Manageable  B) Measurable ✓  C) Mandatory  D) Mapped
3. **[M]** The three-point estimate formula is: — A) (O + M + P) / 3  B) (O + 4M + P) / 6 ✓  C) (O × M × P)^(1/3)  D) (O + P) / 2 + M
4. **[B]** A major limitation of CRISP-DM as a full project methodology is: — A) Too few phases  B) Weak coordination of roles, tools, and infrastructure ✓  C) Too technical  D) Not widely used
5. **[M]** Which requirement characteristic means a requirement can be tested? — A) Complete  B) Verifiable ✓  C) Prioritised  D) Feasible
6. **[M]** Which literature review failure is explicitly warned about? — A) Listing and summarising sources without critical analysis ✓  B) Including too many sources  C) Using peer-reviewed work  D) Referencing correctly
7. **[M]** Which requirements technique involves watching real work practices? — A) Interview  B) JAD  C) Observation ✓  D) Questionnaire
8. **[M]** In a detailed use case description, "preconditions" are: — A) Error paths  B) What must be true before the use case starts ✓  C) Postconditions reversed  D) Alternative flows
9. **[M]** Which clustering evaluation metric is named in the module 14 success criteria? — A) Silhouette  B) Dunn index ✓  C) F1 score  D) AUC
10. **[M]** Elements of a good business problem statement include: — A) Budget and timeline  B) Current state, objective, and success criteria ✓  C) Stakeholder list and risks  D) Team roles and tools
11. **[C]** Why is stakeholder analysis important during planning? — A) It sets the project budget  B) It helps identify requirements, constraints, acceptance issues, and organisational feasibility ✓  C) It replaces risk assessment  D) It defines the technical architecture
12. **[C]** How does a goal differ from an objective? — A) They are the same thing  B) A goal is a broad aim; an objective is a specific measurable step toward it ✓  C) Goals are measurable; objectives are not  D) Objectives come before goals

---

## Summary

| Module | Combined count | From mine | From Claude | Both (deduped) |
|---|---|---|---|---|
| 01 | 10 | 7 | 2 | 1 |
| 02 | 12 | 9 | 2 | 1 |
| 03 | 12 | 9 | 2 | 1 |
| 05 | 13 | 10 | 3 | 0 |
| 06 | 11 | 9 | 1 | 1 |
| 07 | 11 | 8 | 1 | 2 |
| 08 | 11 | 8 | 1 | 2 |
| 09 | 12 | 9 | 2 | 1 |
| 10 | 12 | 9 | 2 | 1 |
| 11 | 13 | 10 | 3 | 0 |
| 12 | 11 | 8 | 1 | 2 |
| 13 | 12 | 9 | 2 | 1 |
| 14 | 12 | 9 | 2 | 1 |
| **Total** | **152** | **114** | **24** | **14** |

Claude's draft had 39 questions across 13 modules (3 each); 14 overlapped conceptually with mine and were deduped, 24 contributed genuinely new angles, 1 (BoW / M13) was phrased better in Claude's version so that wording was kept. Final combined total: **152 unique new questions** ready for review.
