const fs = require('fs');
let p = 'd:/Tuan/phogotarot/src/pages/xem-tarot.astro';
let content = fs.readFileSync(p, 'utf8');

// Replace the payload
let oldPayload = `                        readingId: currentReadingId,
                        userId: currentUserId,
                        reader_id: currentReaderId, // Narrative Reader
                        validationUsage: lastValidationUsage,
                        validationModel: lastValidationModel
                    })
                });`;

let newPayload = `                        readingId: currentReadingId,
                        userId: currentUserId,
                        reader_id: currentReaderId, // Narrative Reader
                        validationUsage: lastValidationUsage,
                        validationModel: lastValidationModel,
                        topic: localStorage.getItem('pending_topic') || 'general'
                    })
                });`;

// Normalize CRLF to LF just in case for replace
content = content.replace(/\r\n/g, '\n');
content = content.replace(oldPayload, newPayload);
content = content.replace(/\n/g, '\r\n'); // Put it back

fs.writeFileSync(p, content);
console.log('Safe patch done');
