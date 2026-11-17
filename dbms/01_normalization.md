# HackMatch — Relational Database Normalization Analysis

**Project:** HackMatch (Data-Driven Hackathon Recommendation Directory)  
**Role:** Database Normalization Documentation
**Assignment:** AP CP1  
**Collaboration Reference:** Coordinated with ER Documentation (`dbms/02_er_diagram.md`), SQL Schema (`dbms/03_schema.sql`), and Queries (`dbms/04_queries.sql`).

---

## 1. Executive Summary & Purpose

HackMatch collects hackathon listings from several platforms and matches students to them by skill overlap. A first, intuitive design stores a student's skills and a hackathon's tags as arrays inside a single row. That design makes matching awkward and invites inconsistent data (for example `IIT Delhi` vs `iit delhi`, or `GenAI` vs `Gen AI`).

This document gives a formal normalization analysis for the **HackMatch** database. It tracks the transformation of the unnormalized design (**UNF**) through **First Normal Form (1NF)**, **Second Normal Form (2NF)**, **Third Normal Form (3NF)**, and verifies **Boyce-Codd Normal Form (BCNF)**.

The resulting schema consists of **six relations** that guarantee:
1. **Zero update anomalies:** Each fact (a college name, a skill name, a hackathon title) is stored in exactly one place.
2. **Lossless-join decomposition:** The original arrays-based design can be reconstructed by joining the six relations.
3. **Dependency preservation:** Every functional dependency is enforced by a primary key, `UNIQUE` constraint or foreign key, with no cross-table assertions.

---

## 2. Unnormalized Form (UNF) & Relational Anomalies

### 2.1 The Unnormalized Relations

$$\text{USERS\_UNF} = \{ \underline{\text{user\_id}}, \text{name}, \text{email}, \text{college}, \{\text{skills}\} \}$$
$$\text{HACKATHONS\_UNF} = \{ \underline{\text{hackathon\_id}}, \text{title}, \text{link}, \text{start\_date}, \{\text{tags}\} \}$$

*Note: Attributes in curly braces $\{ \dots \}$ are repeating groups / multi-valued fields (stored as arrays).*

Sample data:

| user_id | name | email | college | skills |
|---|---|---|---|---|
| usr_01 | Asha | asha@example.com | IIT Delhi | Gen AI, Python |
| usr_02 | Ravi | ravi@example.com | iit delhi | Web3, React, Python |

| hackathon_id | title | link | start_date | tags |
|---|---|---|---|---|
| hk_01 | AI Sprint | unstop.com/ai-sprint | 2026-12-05 | Gen AI, Python |
| hk_02 | ChainFest | devpost.com/chainfest | 2026-12-12 | Web3 |

### 2.2 Operational Anomalies in UNF

1. **Atomicity / Matching Problem:**
   - `skills` and `tags` hold several values in one cell. Finding hackathons for a user requires comparing two arrays, which cannot use a simple index.

2. **Insertion Anomaly:**
   - A new skill (e.g., `Rust`) cannot exist in the system until some user or hackathon uses it.
   - A college cannot be registered before its first student signs up.

3. **Update Anomaly:**
   - Renaming a skill from `Gen AI` to `Generative AI` means editing every user array and every hackathon array that contains it. A missed row leaves two spellings of the same skill.
   - `IIT Delhi` and `iit delhi` are treated as different colleges, breaking any per-college count.

4. **Deletion Anomaly:**
   - Removing the only hackathon that uses a tag such as `Web3` erases the fact that `Web3` is a known skill.

---

## 3. First Normal Form (1NF)

### 3.1 Definition & Requirements
A relation $R$ is in **First Normal Form (1NF)** if and only if:
1. Every attribute contains strictly **atomic (indivisible) values**.
2. There are **no repeating groups** or multi-valued arrays.
3. Each record is uniquely identifiable by a **Primary Key**.

### 3.2 1NF Decomposition Steps
1. **Elimination of Repeating Groups:** each skill and each tag is moved to its own row.

$$\text{USER\_SKILLS\_FLAT}(\underline{\text{user\_id}}, \underline{\text{skill}}, \text{name}, \text{email}, \text{college})$$
$$\text{HACKATHON\_TAGS\_FLAT}(\underline{\text{hackathon\_id}}, \underline{\text{tag}}, \text{title}, \text{link}, \text{start\_date})$$

2. **Primary Key Assignment:** composite keys $\{\text{user\_id}, \text{skill}\}$ and $\{\text{hackathon\_id}, \text{tag}\}$.

| user_id | skill | name | email | college |
|---|---|---|---|---|
| usr_01 | Gen AI | Asha | asha@example.com | IIT Delhi |
| usr_01 | Python | Asha | asha@example.com | IIT Delhi |
| usr_02 | Web3 | Ravi | ravi@example.com | iit delhi |
| usr_02 | React | Ravi | ravi@example.com | iit delhi |
| usr_02 | Python | Ravi | ravi@example.com | iit delhi |

### 3.3 State at 1NF
All data is now atomic, but user and hackathon details are repeated on every skill/tag row, so **partial dependencies** on the composite keys remain.

---

## 4. Second Normal Form (2NF)

### 4.1 Definition & Requirements
A relation $R$ is in **Second Normal Form (2NF)** if and only if:
1. It satisfies **1NF**.
2. Every **non-prime attribute** is **fully functionally dependent** on the whole primary key (no partial dependency on a proper subset of a candidate key).

### 4.2 Partial Functional Dependency Analysis & Elimination

In $\text{USER\_SKILLS\_FLAT}$ with key $\{\text{user\_id}, \text{skill}\}$:
- $\{\text{user\_id}\} \rightarrow \{\text{name}, \text{email}, \text{college}\}$ (**partial dependency on a proper subset of the key**)

In $\text{HACKATHON\_TAGS\_FLAT}$ with key $\{\text{hackathon\_id}, \text{tag}\}$:
- $\{\text{hackathon\_id}\} \rightarrow \{\text{title}, \text{link}, \text{start\_date}\}$ (**partial dependency**)

Consequences: updating a user's college requires editing every skill row; a user who removes their only skill disappears entirely.

### 4.3 2NF Decomposition Result

$$\text{users}(\underline{\text{user\_id}}, \text{name}, \text{email}, \text{college})$$
$$\text{user\_skills}(\underline{\text{user\_id}}, \underline{\text{skill}})$$
$$\text{hackathons}(\underline{\text{hackathon\_id}}, \text{title}, \text{link}, \text{start\_date})$$
$$\text{hackathon\_tags}(\underline{\text{hackathon\_id}}, \underline{\text{tag}})$$

The two link relations contain only key attributes, so no non-prime attribute remains to depend partially. `users` and `hackathons` have single-attribute keys and automatically satisfy 2NF.

---

## 5. Third Normal Form (3NF)

### 5.1 Definition & Requirements
A relation $R$ is in **Third Normal Form (3NF)** if and only if:
1. It satisfies **2NF**.
2. No non-prime attribute is **transitively dependent** on a candidate key.

Formally, for every non-trivial functional dependency $X \rightarrow Y$: $X$ is a **superkey**, **OR** $Y$ is a **prime attribute**.

### 5.2 Dependency Identification & Resolution

#### Case 1: Skill Identity (shared vocabulary)
User skills and hackathon tags are the same domain concept stored as free text in two places.
- **3NF Resolution:** one canonical `skills` relation, referenced by both link tables:
  $$\text{skills}(\underline{\text{id}}, \text{name})$$
  $$\text{user\_skills}(\underline{\text{user\_id}}^{\text{FK}}, \underline{\text{skill\_id}}^{\text{FK}})$$
  $$\text{hackathon\_skills}(\underline{\text{hackathon\_id}}^{\text{FK}}, \underline{\text{skill\_id}}^{\text{FK}})$$
- Matching becomes an integer join on `skill_id` instead of string comparison.

#### Case 2: College Identity
$$\text{users}: \{\text{user\_id}\} \rightarrow \{\text{college}\}$$
- A college is an entity that repeats across many users. Storing its name inline duplicates it and allows `IIT Delhi` / `iit delhi` inconsistencies.
- **3NF Resolution:** separate `colleges`:
  $$\text{colleges}(\underline{\text{id}}, \text{name})$$
  $$\text{users}(\underline{\text{id}}, \text{name}, \text{email}, \text{college\_id}^{\text{FK}})$$

*Note:* `colleges` has no attributes beyond its name today, so strict 3NF did not require this split. It is a deliberate design choice to store each college once and to enable per-college queries (the college leaderboard, Q10).

---

## 6. Boyce-Codd Normal Form (BCNF) Analysis

### 6.1 BCNF Definition
A relation $R$ is in **BCNF** if and only if for every non-trivial functional dependency $X \rightarrow Y$, **$X$ is a superkey of $R$**.

### 6.2 Formal BCNF Verification by Relation

| Relation Name | Determinant ($X$) | Dependent ($Y$) | Is $X$ a Superkey? | Normal Form Evaluation |
|---|---|---|:---:|---|
| **`colleges`** | `{id}` | `{name}` | **YES** (PK) | Satisfies BCNF |
| | `{name}` | `{id}` | **YES** (Unique AK) | Satisfies BCNF |
| **`users`** | `{id}` | `{name, email, college_id}` | **YES** (PK) | Satisfies BCNF |
| | `{email}` | `{id, name, college_id}` | **YES** (Unique AK) | Satisfies BCNF |
| **`skills`** | `{id}` | `{name}` | **YES** (PK) | Satisfies BCNF |
| | `{name}` | `{id}` | **YES** (Unique AK) | Satisfies BCNF |
| **`user_skills`** | `{user_id, skill_id}` | (all attributes — key only) | **YES** (PK) | Satisfies BCNF |
| **`hackathons`** | `{id}` | `{title, link, start_date}` | **YES** (PK) | Satisfies BCNF |
| | `{link}` | `{id, title, start_date}` | **YES** (Unique AK) | Satisfies BCNF |
| **`hackathon_skills`** | `{hackathon_id, skill_id}` | (all attributes — key only) | **YES** (PK) | Satisfies BCNF |

**Conclusion:** In every relation of the HackMatch schema, **every determinant is a candidate key**. The entire schema therefore achieves **Boyce-Codd Normal Form (BCNF)**.

---

## 7. Mathematical Properties of the Decomposition

### 7.1 Lossless-Join Decomposition (Heath's Theorem)
A decomposition of $R$ into $R_1$ and $R_2$ is lossless with respect to a set of functional dependencies $F$ if:

$$(R_1 \cap R_2) \rightarrow R_1 \quad \text{OR} \quad (R_1 \cap R_2) \rightarrow R_2$$

In the HackMatch schema:
- `users` and `colleges`: the shared attribute is `college_id` (= `colleges.id`). Since `id` is the primary key of `colleges`, the join is **lossless**.
- `user_skills` and `users`: the shared attribute `user_id` is the primary key of `users` — **lossless**.
- `user_skills` and `skills`: the shared attribute `skill_id` is the primary key of `skills` — **lossless**.
- `hackathon_skills` with `hackathons` and `skills`: the shared attributes are the primary keys of `hackathons` and `skills` — **lossless**.

Joining all six relations reproduces the original `USERS_UNF` and `HACKATHONS_UNF` data with no spurious tuples.

### 7.2 Dependency Preservation
A decomposition $D = \{R_1, \dots, R_k\}$ preserves $F$ if:

$$\left( \bigcup_{i=1}^k \pi_{R_i}(F) \right)^+ = F^+$$

Every dependency in HackMatch (`id → attributes`, `email → id`, `link → id`, `name → id` on `skills` and `colleges`) is enforced inside a single table by `PRIMARY KEY` or `UNIQUE`, and the relationships are enforced by `FOREIGN KEY`. No triggers or assertions are required, so the decomposition is **fully dependency-preserving**.

---

## 8. Summary Normalization Matrix

| Table Name | 1NF | 2NF | 3NF | BCNF | Primary Key | Alternate Unique Keys |
|---|:---:|:---:|:---:|:---:|---|---|
| `colleges` | ✅ | ✅ | ✅ | ✅ | `id` | `name` |
| `users` | ✅ | ✅ | ✅ | ✅ | `id` (UUID) | `email` |
| `skills` | ✅ | ✅ | ✅ | ✅ | `id` | `name` |
| `user_skills` | ✅ | ✅ | ✅ | ✅ | `(user_id, skill_id)` | None |
| `hackathons` | ✅ | ✅ | ✅ | ✅ | `id` (UUID) | `link` |
| `hackathon_skills` | ✅ | ✅ | ✅ | ✅ | `(hackathon_id, skill_id)` | None |

---

## 9. Final Schema

```sql
colleges         (id PK, name UNIQUE)
users            (id PK, name, email UNIQUE, college_id FK -> colleges)
skills           (id PK, name UNIQUE)
user_skills      (user_id FK -> users, skill_id FK -> skills, PK(user_id, skill_id))
hackathons       (id PK, title, link UNIQUE, start_date)
hackathon_skills (hackathon_id FK -> hackathons, skill_id FK -> skills, PK(hackathon_id, skill_id))
```

The full DDL is in `dbms/03_schema.sql`. The recommendation query is now a simple join on `skill_id`:

```sql
SELECT h.*, COUNT(*) AS match_score
FROM user_skills us
JOIN hackathon_skills hs ON hs.skill_id = us.skill_id
JOIN hackathons h        ON h.id = hs.hackathon_id
WHERE us.user_id = $1
GROUP BY h.id
ORDER BY match_score DESC, h.start_date ASC;
```

---

## 10. Design Notes

- PostgreSQL could store skills as `TEXT[]` with a GIN index, which would likely be fast enough at our size. We chose junction tables because they keep skills consistent, support foreign keys, and will be needed for Phase 2 (matching teammates with complementary skills).
- The scraper lowercases and trims tags and maps them to an existing skill row before inserting, otherwise the `skills` table fills up with near-duplicates.
- `users` and `hackathons` use UUIDs so references don't break if an email or link changes. `email` and `link` stay unique, which also prevents duplicate scrapes.

---

## 11. Academic Certification

This document confirms that the HackMatch database architecture is normalized to **Third Normal Form (3NF)** and complies with **Boyce-Codd Normal Form (BCNF)**. The design eliminates update anomalies, supports lossless joins, and guarantees data integrity through declarative constraints.
