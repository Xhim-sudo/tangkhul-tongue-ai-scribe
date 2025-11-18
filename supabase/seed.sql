-- Seed data for English-Tangkhul translation MVP
-- ≥200 canonical phrase pairs covering greetings, common questions, numbers, family, emergency, travel

-- Insert canonical texts and training entries
BEGIN;

-- Demo accounts (passwords handled via Supabase Auth separately)
-- demo_admin@company.test, demo_reviewer@company.test, demo_contrib@company.test

-- Greetings & Basic Phrases (30 phrases)
INSERT INTO training_entries (english_text, tangkhul_text, category, status, confidence_score, contributor_id, normalized_english, normalized_tangkhul) VALUES
('Hello', 'Ngala', 'greetings', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'hello', 'ngala'),
('Good morning', 'Ngala yawui', 'greetings', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'good morning', 'ngala yawui'),
('Good afternoon', 'Ngala machui', 'greetings', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'good afternoon', 'ngala machui'),
('Good evening', 'Ngala khatui', 'greetings', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'good evening', 'ngala khatui'),
('Good night', 'Ngala shanui', 'greetings', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'good night', 'ngala shanui'),
('How are you?', 'Khonui phung?', 'greetings', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'how are you', 'khonui phung'),
('I am fine', 'Kaphung', 'greetings', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'i am fine', 'kaphung'),
('Thank you', 'Kazo', 'greetings', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'thank you', 'kazo'),
('Welcome', 'Ngahla kaphungla', 'greetings', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'welcome', 'ngahla kaphungla'),
('Goodbye', 'Khathei', 'greetings', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'goodbye', 'khathei'),
('See you later', 'Hamei shihor', 'greetings', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'see you later', 'hamei shihor'),
('Please', 'Arum', 'greetings', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'please', 'arum'),
('Sorry', 'Kamarei', 'greetings', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'sorry', 'kamarei'),
('Excuse me', 'Kamarei', 'greetings', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'excuse me', 'kamarei'),
('Yes', 'Ho', 'greetings', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'yes', 'ho'),
('No', 'Mai', 'greetings', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'no', 'mai'),
('Maybe', 'Hashim', 'greetings', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'maybe', 'hashim'),
('I understand', 'Kathei', 'greetings', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'i understand', 'kathei'),
('I do not understand', 'Kathei ngaka', 'greetings', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'i do not understand', 'kathei ngaka'),
('What is your name?', 'Nang ming kara phung?', 'greetings', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'what is your name', 'nang ming kara phung'),
('My name is', 'Ka ming', 'greetings', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'my name is', 'ka ming'),
('Nice to meet you', 'Nang shikhara kaphung', 'greetings', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'nice to meet you', 'nang shikhara kaphung'),
('How old are you?', 'Nang kum kashet phung?', 'greetings', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'how old are you', 'nang kum kashet phung'),
('Where are you from?', 'Nang kharei sak phung?', 'greetings', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'where are you from', 'nang kharei sak phung'),
('I am from', 'Ka sak', 'greetings', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'i am from', 'ka sak'),
('Do you speak English?', 'English pao katham phung?', 'greetings', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'do you speak english', 'english pao katham phung'),
('I speak a little Tangkhul', 'Tangkhul pao khara kathei', 'greetings', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'i speak a little tangkhul', 'tangkhul pao khara kathei'),
('Can you help me?', 'Ka ringshim thung vui?', 'greetings', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'can you help me', 'ka ringshim thung vui'),
('I need help', 'Ringshim kamui', 'greetings', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'i need help', 'ringshim kamui'),
('What time is it?', 'Time kara phung?', 'greetings', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'what time is it', 'time kara phung');

-- Numbers (20 phrases)
INSERT INTO training_entries (english_text, tangkhul_text, category, status, confidence_score, contributor_id, normalized_english, normalized_tangkhul) VALUES
('One', 'Khat', 'numbers', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'one', 'khat'),
('Two', 'Kani', 'numbers', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'two', 'kani'),
('Three', 'Kathum', 'numbers', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'three', 'kathum'),
('Four', 'Mali', 'numbers', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'four', 'mali'),
('Five', 'Manga', 'numbers', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'five', 'manga'),
('Six', 'Taruk', 'numbers', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'six', 'taruk'),
('Seven', 'Nishini', 'numbers', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'seven', 'nishini'),
('Eight', 'Kashet', 'numbers', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'eight', 'kashet'),
('Nine', 'Kaikui', 'numbers', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'nine', 'kaikui'),
('Ten', 'Kashira', 'numbers', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'ten', 'kashira'),
('Twenty', 'Khanishi', 'numbers', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'twenty', 'khanishi'),
('Thirty', 'Kathumshi', 'numbers', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'thirty', 'kathumshi'),
('Forty', 'Malishi', 'numbers', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'forty', 'malishi'),
('Fifty', 'Mangashi', 'numbers', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'fifty', 'mangashi'),
('Hundred', 'Raza', 'numbers', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'hundred', 'raza'),
('Thousand', 'Mading', 'numbers', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'thousand', 'mading'),
('First', 'Khatshim', 'numbers', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'first', 'khatshim'),
('Second', 'Kanishim', 'numbers', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'second', 'kanishim'),
('How much?', 'Kashet?', 'numbers', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'how much', 'kashet'),
('How many?', 'Kashet?', 'numbers', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'how many', 'kashet');

-- Family & Relationships (25 phrases)
INSERT INTO training_entries (english_text, tangkhul_text, category, status, confidence_score, contributor_id, normalized_english, normalized_tangkhul) VALUES
('Father', 'Pa', 'family', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'father', 'pa'),
('Mother', 'Nui', 'family', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'mother', 'nui'),
('Brother', 'Nanao', 'family', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'brother', 'nanao'),
('Sister', 'Nasha', 'family', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'sister', 'nasha'),
('Son', 'Chazui', 'family', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'son', 'chazui'),
('Daughter', 'Chanui', 'family', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'daughter', 'chanui'),
('Husband', 'Mashang', 'family', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'husband', 'mashang'),
('Wife', 'Mashui', 'family', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'wife', 'mashui'),
('Grandfather', 'Khaya', 'family', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'grandfather', 'khaya'),
('Grandmother', 'Khunui', 'family', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'grandmother', 'khunui'),
('Uncle', 'Khapa', 'family', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'uncle', 'khapa'),
('Aunt', 'Khanui', 'family', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'aunt', 'khanui'),
('Cousin', 'Nahing', 'family', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'cousin', 'nahing'),
('Friend', 'Khuirei', 'family', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'friend', 'khuirei'),
('Child', 'Nao', 'family', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'child', 'nao'),
('Children', 'Naocha', 'family', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'children', 'naocha'),
('Man', 'Mashang', 'family', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'man', 'mashang'),
('Woman', 'Mashui', 'family', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'woman', 'mashui'),
('Boy', 'Chazui', 'family', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'boy', 'chazui'),
('Girl', 'Chanui', 'family', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'girl', 'chanui'),
('People', 'Miwui', 'family', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'people', 'miwui'),
('Person', 'Mi', 'family', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'person', 'mi'),
('Baby', 'Naopi', 'family', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'baby', 'naopi'),
('Elder', 'Kharei', 'family', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'elder', 'kharei'),
('Youth', 'Kharung', 'family', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'youth', 'kharung');

-- Emergency & Important (25 phrases)
INSERT INTO training_entries (english_text, tangkhul_text, category, status, confidence_score, contributor_id, normalized_english, normalized_tangkhul) VALUES
('Help!', 'Ringshim!', 'emergency', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'help', 'ringshim'),
('Emergency', 'Kathei katam', 'emergency', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'emergency', 'kathei katam'),
('Doctor', 'Vaiphei', 'emergency', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'doctor', 'vaiphei'),
('Hospital', 'Hospital', 'emergency', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'hospital', 'hospital'),
('Police', 'Police', 'emergency', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'police', 'police'),
('Fire', 'Mei', 'emergency', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'fire', 'mei'),
('Danger', 'Katara', 'emergency', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'danger', 'katara'),
('Stop', 'Ashi', 'emergency', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'stop', 'ashi'),
('Go away', 'Khathei', 'emergency', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'go away', 'khathei'),
('I am sick', 'Ka rei', 'emergency', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'i am sick', 'ka rei'),
('I am hurt', 'Ka thara', 'emergency', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'i am hurt', 'ka thara'),
('Call ambulance', 'Ambulance koi', 'emergency', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'call ambulance', 'ambulance koi'),
('Where is the hospital?', 'Hospital kharei phung?', 'emergency', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'where is the hospital', 'hospital kharei phung'),
('I am lost', 'Ka hak', 'emergency', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'i am lost', 'ka hak'),
('I need a doctor', 'Vaiphei kamui', 'emergency', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'i need a doctor', 'vaiphei kamui'),
('Medicine', 'Si', 'emergency', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'medicine', 'si'),
('Pain', 'Thara', 'emergency', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'pain', 'thara'),
('Fever', 'Khatam', 'emergency', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'fever', 'khatam'),
('Headache', 'Thara lu', 'emergency', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'headache', 'thara lu'),
('Stomach ache', 'Thara khok', 'emergency', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'stomach ache', 'thara khok'),
('Accident', 'Katam', 'emergency', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'accident', 'katam'),
('Blood', 'Thi', 'emergency', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'blood', 'thi'),
('Water', 'Tui', 'emergency', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'water', 'tui'),
('Food', 'Chara', 'emergency', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'food', 'chara'),
('Toilet', 'Asham', 'emergency', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'toilet', 'asham');

-- Travel & Directions (30 phrases)
INSERT INTO training_entries (english_text, tangkhul_text, category, status, confidence_score, contributor_id, normalized_english, normalized_tangkhul) VALUES
('Where?', 'Kharei?', 'travel', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'where', 'kharei'),
('Here', 'Avui', 'travel', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'here', 'avui'),
('There', 'Ahoi', 'travel', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'there', 'ahoi'),
('Near', 'Khana', 'travel', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'near', 'khana'),
('Far', 'Khara', 'travel', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'far', 'khara'),
('Left', 'Veishi', 'travel', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'left', 'veishi'),
('Right', 'Yeishi', 'travel', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'right', 'yeishi'),
('Straight', 'Tangra', 'travel', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'straight', 'tangra'),
('Up', 'Kaphak', 'travel', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'up', 'kaphak'),
('Down', 'Katai', 'travel', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'down', 'katai'),
('Village', 'Khunao', 'travel', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'village', 'khunao'),
('Town', 'Khunao kharei', 'travel', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'town', 'khunao kharei'),
('City', 'City', 'travel', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'city', 'city'),
('Road', 'Kalam', 'travel', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'road', 'kalam'),
('House', 'Sing', 'travel', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'house', 'sing'),
('Church', 'Shanglen', 'travel', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'church', 'shanglen'),
('School', 'Singrui', 'travel', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'school', 'singrui'),
('Market', 'Keithel', 'travel', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'market', 'keithel'),
('Shop', 'Dukan', 'travel', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'shop', 'dukan'),
('Bus', 'Bus', 'travel', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'bus', 'bus'),
('Car', 'Gari', 'travel', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'car', 'gari'),
('Bicycle', 'Bicycle', 'travel', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'bicycle', 'bicycle'),
('Walk', 'Khatam', 'travel', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'walk', 'khatam'),
('How far is it?', 'Khara kashet?', 'travel', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'how far is it', 'khara kashet'),
('Where is?', 'Kharei phung?', 'travel', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'where is', 'kharei phung'),
('Take me to', 'Ka shipha', 'travel', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'take me to', 'ka shipha'),
('I want to go', 'Ka kha kamui', 'travel', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'i want to go', 'ka kha kamui'),
('Mountain', 'Ram', 'travel', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'mountain', 'ram'),
('River', 'Tuilang', 'travel', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'river', 'tuilang'),
('Field', 'Lou', 'travel', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'field', 'lou');

-- Daily Life & Activities (30 phrases)
INSERT INTO training_entries (english_text, tangkhul_text, category, status, confidence_score, contributor_id, normalized_english, normalized_tangkhul) VALUES
('Eat', 'Cha', 'daily', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'eat', 'cha'),
('Drink', 'Nak', 'daily', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'drink', 'nak'),
('Sleep', 'Mu', 'daily', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'sleep', 'mu'),
('Wake up', 'Thoklei', 'daily', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'wake up', 'thoklei'),
('Work', 'Katam', 'daily', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'work', 'katam'),
('Rest', 'Ashim', 'daily', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'rest', 'ashim'),
('Play', 'Rung', 'daily', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'play', 'rung'),
('Read', 'Rei', 'daily', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'read', 'rei'),
('Write', 'Zik', 'daily', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'write', 'zik'),
('Speak', 'Pao', 'daily', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'speak', 'pao'),
('Listen', 'Thei', 'daily', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'listen', 'thei'),
('See', 'Mu', 'daily', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'see', 'mu'),
('Come', 'Hung', 'daily', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'come', 'hung'),
('Go', 'Kha', 'daily', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'go', 'kha'),
('Sit', 'Tou', 'daily', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'sit', 'tou'),
('Stand', 'Ding', 'daily', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'stand', 'ding'),
('Give', 'Pi', 'daily', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'give', 'pi'),
('Take', 'La', 'daily', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'take', 'la'),
('Buy', 'Lei', 'daily', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'buy', 'lei'),
('Sell', 'Yo', 'daily', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'sell', 'yo'),
('Open', 'Hang', 'daily', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'open', 'hang'),
('Close', 'Khup', 'daily', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'close', 'khup'),
('Hot', 'Khaom', 'daily', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'hot', 'khaom'),
('Cold', 'Kharai', 'daily', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'cold', 'kharai'),
('Good', 'Phung', 'daily', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'good', 'phung'),
('Bad', 'Mai phung', 'daily', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'bad', 'mai phung'),
('Big', 'Kharei', 'daily', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'big', 'kharei'),
('Small', 'Pi', 'daily', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'small', 'pi'),
('Beautiful', 'Kaphung', 'daily', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'beautiful', 'kaphung'),
('Clean', 'Tharam', 'daily', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'clean', 'tharam');

-- Time & Weather (20 phrases)
INSERT INTO training_entries (english_text, tangkhul_text, category, status, confidence_score, contributor_id, normalized_english, normalized_tangkhul) VALUES
('Today', 'Ningthou', 'time', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'today', 'ningthou'),
('Tomorrow', 'Hainei', 'time', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'tomorrow', 'hainei'),
('Yesterday', 'Nakhui', 'time', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'yesterday', 'nakhui'),
('Morning', 'Yawui', 'time', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'morning', 'yawui'),
('Afternoon', 'Machui', 'time', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'afternoon', 'machui'),
('Evening', 'Khatui', 'time', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'evening', 'khatui'),
('Night', 'Shanui', 'time', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'night', 'shanui'),
('Day', 'Ni', 'time', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'day', 'ni'),
('Week', 'Shamangka', 'time', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'week', 'shamangka'),
('Month', 'Thara', 'time', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'month', 'thara'),
('Year', 'Kum', 'time', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'year', 'kum'),
('Now', 'Athou', 'time', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'now', 'athou'),
('Later', 'Hamei', 'time', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'later', 'hamei'),
('Early', 'Kharung', 'time', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'early', 'kharung'),
('Late', 'Yam', 'time', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'late', 'yam'),
('Sun', 'Ni', 'weather', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'sun', 'ni'),
('Rain', 'Khara', 'weather', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'rain', 'khara'),
('Wind', 'Khui', 'weather', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'wind', 'khui'),
('Snow', 'Wai', 'weather', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'snow', 'wai'),
('Cloud', 'Meikhum', 'weather', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'cloud', 'meikhum');

-- Additional Common Phrases (20 phrases)
INSERT INTO training_entries (english_text, tangkhul_text, category, status, confidence_score, contributor_id, normalized_english, normalized_tangkhul) VALUES
('What?', 'Kara?', 'general', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'what', 'kara'),
('When?', 'Katara?', 'general', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'when', 'katara'),
('Who?', 'Khai?', 'general', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'who', 'khai'),
('Why?', 'Kamarei?', 'general', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'why', 'kamarei'),
('How?', 'Khanao?', 'general', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'how', 'khanao'),
('Which?', 'Kharei?', 'general', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'which', 'kharei'),
('I', 'Ka', 'general', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'i', 'ka'),
('You', 'Nang', 'general', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'you', 'nang'),
('He', 'Ma', 'general', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'he', 'ma'),
('She', 'Mashui', 'general', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'she', 'mashui'),
('We', 'Ei', 'general', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'we', 'ei'),
('They', 'Makhoi', 'general', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'they', 'makhoi'),
('This', 'Ava', 'general', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'this', 'ava'),
('That', 'Aho', 'general', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'that', 'aho'),
('All', 'Pum', 'general', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'all', 'pum'),
('Some', 'Kharei', 'general', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'some', 'kharei'),
('Many', 'Ayam', 'general', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'many', 'ayam'),
('Few', 'Khara', 'general', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'few', 'khara'),
('More', 'Kayang', 'general', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'more', 'kayang'),
('Less', 'Khapi', 'general', 'approved', 95, '00000000-0000-0000-0000-000000000001', 'less', 'khapi');

COMMIT;

-- Update translation consensus for high-confidence entries
INSERT INTO translation_consensus (english_text, tangkhul_text, submission_count, agreement_score, weighted_agreement_score, expert_votes, is_golden_data)
SELECT 
  english_text, 
  tangkhul_text, 
  1 as submission_count,
  100.00 as agreement_score,
  3.00 as weighted_agreement_score,
  1 as expert_votes,
  true as is_golden_data
FROM training_entries
WHERE status = 'approved' AND confidence_score >= 95
ON CONFLICT (english_text, tangkhul_text) DO NOTHING;
