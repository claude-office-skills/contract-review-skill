# Key Terms Extraction Prompt

Extract the following key terms from the contract in a structured JSON format.

## Required Fields

1. **Contract Type** - What kind of contract is this?
2. **Parties** - Who are the parties involved?
3. **Dates** - Effective date, end date, signing date
4. **Financial Terms** - Amounts, payment terms
5. **Key Clauses** - Important provisions
6. **Obligations** - What each party must do
7. **Termination** - How can the contract be ended?
8. **Confidentiality** - Are there secrecy requirements?
9. **Dispute Resolution** - How are disputes handled?

## Output Format

Return a valid JSON object with the structure defined in the prompt.

## Notes

- Use null for missing information
- Use ISO date format (YYYY-MM-DD)
- Include currency symbols with amounts
- Quote original text when relevant
