# Test fixture files

Place files needed by E2E tests here. Name them by their role in the test.

Examples:
- `valid-record.pdf` — a valid medical record PDF for happy-path tests
- `invalid-format.docx` — a non-PDF file to test format validation
- `large-file.pdf` — a file over the size limit to test the size guard
- `transcript.txt` — a plain text transcript for upload tests

Keep files small. These are fixtures, not real documents — they only need to
trigger the right code path, not contain meaningful content.

Never commit files containing real personal or clinical data.
