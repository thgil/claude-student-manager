// localStorage-based data store

function seedTestData() {
  const students = [
    { id: 1, name: 'Emma O\'Brien', email: 'emma.obrien@email.com', phone: '087 123 4567', notes: 'Beginner level. Interested in Japanese for travel. Very enthusiastic learner.', hourly_rate: 35, created_at: '2024-09-01T10:00:00Z' },
    { id: 2, name: 'Liam Murphy', email: 'liam.m@email.com', phone: '086 234 5678', notes: 'Intermediate level. Studying for JLPT N3. Works in tech, interested in reading manga.', hourly_rate: 35, created_at: '2024-09-15T10:00:00Z' },
    { id: 3, name: 'Sophie Chen', email: 'sophie.chen@email.com', phone: '085 345 6789', notes: 'Advanced beginner. Heritage speaker - can understand spoken Japanese but needs help with reading/writing.', hourly_rate: 30, created_at: '2024-10-01T10:00:00Z' },
  ];

  const lessonNotes = [
    // Emma's lessons (beginner)
    ['Introduced hiragana あ-こ. Emma picked up the stroke order quickly. Homework: practice writing each character 10 times.', 'Reviewed あ-こ, introduced さ-と. Practiced basic greetings: こんにちは、おはようございます. She struggles a bit with さ and き - similar shapes.', 'Hiragana さ-と review. Started な-ほ. Introduced self-introduction: はじめまして、エマです。Good pronunciation!', 'Completed hiragana な-ほ. Grammar point: です/ではありません. Emma made good progress today.', 'Hiragana ま-よ. Vocabulary: numbers 1-10. She found よん/し confusing - explained the two readings.', 'Finished hiragana ら-ん. Now knows full hiragana set! Practiced reading simple words. Homework: hiragana worksheet.', 'Hiragana review and reading practice. Introduced は particle for topics. Watashi wa Emma desu.', 'Started katakana ア-コ. Discussed when katakana is used (foreign words). Practiced writing コーヒー、ケーキ.', 'Katakana サ-ト. Vocabulary: food and drinks. Practiced ordering at restaurant: ___をください。', 'Katakana ナ-ホ. Grammar: adjectives (i-adjectives). おいしい、たかい、やすい. Restaurant vocabulary expansion.', 'Katakana マ-ヨ. Practiced reading menu items. Role-play: ordering food. Emma really enjoyed this!', 'Finished katakana ラ-ン. Review session - wrote out all hiragana and katakana from memory. Great progress!'],
    // Liam's lessons (intermediate, JLPT focused)
    ['JLPT N3 grammar: ようにする vs ようになる. Worked through practice problems. Liam tends to mix these up.', 'Vocabulary review: 50 new N3 words. Reading comprehension practice with short article about technology.', 'Grammar: ことにする/ことになる. Compared with ようにする. Liam found the decision vs circumstance distinction helpful.', 'Kanji practice: 20 new kanji compounds. Reading: manga excerpt (One Piece). Discussed casual speech patterns.', 'JLPT N3 listening practice. Reviewed tricky patterns: んです、のに、ても. Mock test section 1.', 'Grammar: passive voice review. ラーメンが食べられた vs ラーメンを食べられた. Common mistakes discussed.', 'Causative form introduction: させる/させられる. Practice sentences about work situations.', 'Reading comprehension: news article about AI. New vocabulary: 人工知能、開発、影響. Good discussion!', 'JLPT mock test review. Focused on listening section - reviewed wrong answers. Need more practice with fast speech.', 'Grammar: ばかり、だらけ、まみれ - differences in usage. Vocabulary: weather and seasons.', 'Kanji review session - 100 N3 kanji. Liam knows about 80% well. Made flashcard list for weak ones.', 'Conditional forms review: と、ば、たら、なら. When to use each - this is tricky even for advanced learners.'],
    // Sophie's lessons (heritage speaker, reading/writing focus)
    ['Assessment lesson. Sophie understands spoken Japanese well but reads at beginner level. Made study plan focusing on kanji.', 'Basic kanji: 日、月、火、水、木、金、土 (days of week). She knows these from hearing but never wrote them.', 'Kanji: numbers 一-十、百、千、万. Practiced reading prices. Sophie was surprised how much she could guess from context.', 'Kanji: 人、子、女、男、学、生. Introduced radicals concept - this really helped her remember kanji structure.', 'Reading practice: children\'s book level 1. Sophie found this both easy (comprehension) and hard (reading). Good balance!', 'Kanji: 食、飲、見、聞、話、読、書. Daily verbs she uses but never saw written. Connected speaking to reading.', 'Grammar review: は vs が. Sophie uses these correctly when speaking but couldn\'t explain why. Now she understands!', 'Kanji: 大、小、高、安、新、古. Adjectives in kanji form. Reading practice with shopping dialogue.', 'Hiragana/katakana speed reading practice. Sophie is getting faster! Read short story about a cat.', 'Kanji: 行、来、帰、出、入. Direction/movement verbs. Created example sentences about her daily routine.', 'Reading: recipe in Japanese. New vocabulary: 材料、切る、混ぜる、焼く. Sophie wants to try making tamagoyaki!', 'Kanji radicals deep-dive: 氵(water)、火、木、口. How radicals give meaning hints. Sophie found this fascinating.'],
  ];

  const lessons = [];
  let lessonId = 1;
  const today = new Date();

  // Generate lessons for each student over past 3 months
  students.forEach((student, studentIndex) => {
    const notes = lessonNotes[studentIndex];
    let noteIndex = 0;

    // Start 12 weeks ago
    for (let weeksAgo = 12; weeksAgo >= 0; weeksAgo--) {
      // 1-2 lessons per week
      const lessonsThisWeek = weeksAgo % 3 === 0 ? 1 : 2;

      for (let i = 0; i < lessonsThisWeek && noteIndex < notes.length; i++) {
        const lessonDate = new Date(today);
        lessonDate.setDate(lessonDate.getDate() - (weeksAgo * 7) - (i * 3));

        // Lessons from last week are unpaid, older than 3 weeks are paid
        const isPaid = weeksAgo > 3 || (weeksAgo > 0 && weeksAgo <= 3 && Math.random() > 0.3);

        lessons.push({
          id: lessonId++,
          student_id: student.id,
          date: lessonDate.toISOString().split('T')[0],
          duration_minutes: 60,
          hourly_rate: student.hourly_rate,
          notes: notes[noteIndex],
          is_paid: isPaid,
          created_at: lessonDate.toISOString()
        });
        noteIndex++;
      }
    }
  });

  // Add extra recent unpaid lessons

  // Emma - lesson 2 days ago
  lessons.push({
    id: lessonId++,
    student_id: 1,
    date: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    duration_minutes: 60,
    hourly_rate: 35,
    notes: 'Started basic kanji: 山、川、田、森. Emma was excited to finally learn kanji! We focused on pictographic origins to help memorization.',
    is_paid: false,
    created_at: new Date().toISOString()
  });

  // Liam - lesson 4 days ago
  lessons.push({
    id: lessonId++,
    student_id: 2,
    date: new Date(today.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    duration_minutes: 90,
    hourly_rate: 35,
    notes: 'Extended session for JLPT practice. Full mock test under timed conditions. Liam scored 68% - needs more work on reading section. Reviewed keigo patterns.',
    is_paid: false,
    created_at: new Date().toISOString()
  });

  // Sophie - lesson yesterday
  lessons.push({
    id: lessonId++,
    student_id: 3,
    date: new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    duration_minutes: 60,
    hourly_rate: 30,
    notes: 'Kanji compounds: 電話、電車、電気. Sophie noticed the 電 pattern - great observation! Read a short dialogue about making phone calls.',
    is_paid: false,
    created_at: new Date().toISOString()
  });

  // Random one-off lessons scattered through the past months

  // Emma - extra session before her trip
  lessons.push({
    id: lessonId++,
    student_id: 1,
    date: new Date(today.getTime() - 35 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    duration_minutes: 90,
    hourly_rate: 35,
    notes: 'Extra session before Emma\'s Tokyo trip! Focused on practical phrases: asking for directions, ordering food, shopping. Role-played common scenarios. She feels much more confident now.',
    is_paid: true,
    created_at: new Date().toISOString()
  });

  // Liam - weekend intensive
  lessons.push({
    id: lessonId++,
    student_id: 2,
    date: new Date(today.getTime() - 21 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    duration_minutes: 120,
    hourly_rate: 35,
    notes: 'Weekend intensive session. Covered N3 grammar points: てしまう、ことがある、ようにする. Liam requested extra practice before the JLPT registration deadline. Good stamina for 2 hours!',
    is_paid: true,
    created_at: new Date().toISOString()
  });

  // Sophie - makeup lesson
  lessons.push({
    id: lessonId++,
    student_id: 3,
    date: new Date(today.getTime() - 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    duration_minutes: 45,
    hourly_rate: 30,
    notes: 'Makeup lesson (shorter due to scheduling). Quick review of kanji from last 2 weeks. Sophie retained most of them well. Introduced 時、分、今 for telling time.',
    is_paid: true,
    created_at: new Date().toISOString()
  });

  // Emma - cancelled and rescheduled
  lessons.push({
    id: lessonId++,
    student_id: 1,
    date: new Date(today.getTime() - 52 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    duration_minutes: 60,
    hourly_rate: 35,
    notes: 'Rescheduled from last week. Continued with katakana practice. Emma is getting faster at reading! Introduced some loanwords: テレビ、パソコン、スマホ.',
    is_paid: true,
    created_at: new Date().toISOString()
  });

  // Liam - conversation practice
  lessons.push({
    id: lessonId++,
    student_id: 2,
    date: new Date(today.getTime() - 8 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    duration_minutes: 60,
    hourly_rate: 35,
    notes: 'Conversation-only session as requested. Discussed Liam\'s work in Japanese, practiced keigo for business situations. He wants to use Japanese with his company\'s Tokyo office.',
    is_paid: false,
    created_at: new Date().toISOString()
  });

  // Sophie - double lesson
  lessons.push({
    id: lessonId++,
    student_id: 3,
    date: new Date(today.getTime() - 28 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    duration_minutes: 120,
    hourly_rate: 30,
    notes: 'Double lesson - Sophie wanted to make up for missed weeks. First hour: kanji review and new characters. Second hour: reading practice with a children\'s story about tanuki. She loved it!',
    is_paid: true,
    created_at: new Date().toISOString()
  });

  // Emma - trial friend
  lessons.push({
    id: lessonId++,
    student_id: 1,
    date: new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    duration_minutes: 30,
    hourly_rate: 0,
    notes: 'Emma\'s friend Sarah joined for a free trial (first 30 min). Showed her the basics while Emma practiced. Sarah seemed interested - may become a new student!',
    is_paid: true,
    created_at: new Date().toISOString()
  });

  // Sort lessons by date descending
  lessons.sort((a, b) => new Date(b.date) - new Date(a.date));

  // Sample recurring schedules
  const schedules = [
    { id: lessonId++, student_id: 1, is_recurring: true, day_of_week: 'tuesday', date: null, time: '16:00', duration_minutes: 60, notes: 'Weekly lesson - hiragana/katakana practice', created_at: new Date().toISOString() },
    { id: lessonId++, student_id: 2, is_recurring: true, day_of_week: 'wednesday', date: null, time: '18:00', duration_minutes: 60, notes: 'JLPT N3 prep', created_at: new Date().toISOString() },
    { id: lessonId++, student_id: 2, is_recurring: true, day_of_week: 'saturday', date: null, time: '10:00', duration_minutes: 90, notes: 'Weekend intensive - reading practice', created_at: new Date().toISOString() },
    { id: lessonId++, student_id: 3, is_recurring: true, day_of_week: 'thursday', date: null, time: '17:30', duration_minutes: 60, notes: 'Kanji and reading focus', created_at: new Date().toISOString() },
  ];

  return {
    students,
    lessons,
    payments: [],
    schedules,
    nextId: lessonId + 10
  };
}

function getData() {
  const data = localStorage.getItem('tutoring-data');
  if (!data) {
    const seeded = seedTestData();
    saveData(seeded);
    return seeded;
  }
  return JSON.parse(data);
}

function saveData(data) {
  localStorage.setItem('tutoring-data', JSON.stringify(data));
}

function getNextId() {
  const data = getData();
  const id = data.nextId || 1;
  data.nextId = id + 1;
  saveData(data);
  return id;
}

// Students API
export const studentsApi = {
  getAll: async () => {
    const data = getData();
    return data.students.map(s => {
      const studentLessons = data.lessons.filter(l => l.student_id === s.id);
      const unpaidLessons = studentLessons.filter(l => !l.is_paid);
      return {
        ...s,
        lesson_count: studentLessons.length,
        unpaid_count: unpaidLessons.length,
        unpaid_amount: unpaidLessons.reduce((sum, l) => sum + (l.hourly_rate * l.duration_minutes / 60), 0)
      };
    }).sort((a, b) => a.name.localeCompare(b.name));
  },

  getOne: async (id) => {
    const data = getData();
    const student = data.students.find(s => s.id === parseInt(id));
    if (!student) return null;

    const lessons = data.lessons
      .filter(l => l.student_id === parseInt(id))
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    const payments = data.payments
      .filter(p => p.student_id === parseInt(id))
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    return { ...student, lessons, payments };
  },

  create: async ({ name, email, phone, notes, hourly_rate }) => {
    const data = getData();
    const student = {
      id: getNextId(),
      name,
      email: email || null,
      phone: phone || null,
      notes: notes || null,
      hourly_rate: hourly_rate || 30,
      created_at: new Date().toISOString()
    };
    data.students.push(student);
    saveData(data);
    return student;
  },

  update: async (id, { name, email, phone, notes, hourly_rate }) => {
    const data = getData();
    const index = data.students.findIndex(s => s.id === parseInt(id));
    if (index === -1) throw new Error('Student not found');

    data.students[index] = {
      ...data.students[index],
      name,
      email: email || null,
      phone: phone || null,
      notes: notes || null,
      hourly_rate: hourly_rate || 30
    };
    saveData(data);
    return data.students[index];
  },

  delete: async (id) => {
    const data = getData();
    data.students = data.students.filter(s => s.id !== parseInt(id));
    data.lessons = data.lessons.filter(l => l.student_id !== parseInt(id));
    data.payments = data.payments.filter(p => p.student_id !== parseInt(id));
    saveData(data);
  }
};

// Lessons API
export const lessonsApi = {
  getAll: async (params = {}) => {
    const data = getData();
    let lessons = data.lessons.map(l => {
      const student = data.students.find(s => s.id === l.student_id);
      return { ...l, student_name: student?.name || 'Unknown' };
    });

    if (params.student_id) {
      lessons = lessons.filter(l => l.student_id === parseInt(params.student_id));
    }
    if (params.unpaid_only === 'true') {
      lessons = lessons.filter(l => !l.is_paid);
    }

    return lessons.sort((a, b) => new Date(b.date) - new Date(a.date));
  },

  create: async ({ student_id, date, duration_minutes, hourly_rate, notes }) => {
    const data = getData();
    const student = data.students.find(s => s.id === parseInt(student_id));

    const lesson = {
      id: getNextId(),
      student_id: parseInt(student_id),
      date,
      duration_minutes: duration_minutes || 60,
      hourly_rate: hourly_rate || student?.hourly_rate || 30,
      notes: notes || null,
      is_paid: false,
      created_at: new Date().toISOString()
    };
    data.lessons.push(lesson);
    saveData(data);
    return { ...lesson, student_name: student?.name };
  },

  update: async (id, { date, duration_minutes, hourly_rate, notes, is_paid }) => {
    const data = getData();
    const index = data.lessons.findIndex(l => l.id === parseInt(id));
    if (index === -1) throw new Error('Lesson not found');

    data.lessons[index] = {
      ...data.lessons[index],
      date,
      duration_minutes,
      hourly_rate,
      notes: notes || null,
      is_paid: !!is_paid
    };
    saveData(data);

    const student = data.students.find(s => s.id === data.lessons[index].student_id);
    return { ...data.lessons[index], student_name: student?.name };
  },

  delete: async (id) => {
    const data = getData();
    data.lessons = data.lessons.filter(l => l.id !== parseInt(id));
    saveData(data);
  },

  markPaid: async (id, is_paid) => {
    const data = getData();
    const index = data.lessons.findIndex(l => l.id === parseInt(id));
    if (index === -1) throw new Error('Lesson not found');

    data.lessons[index].is_paid = !!is_paid;
    saveData(data);

    const student = data.students.find(s => s.id === data.lessons[index].student_id);
    return { ...data.lessons[index], student_name: student?.name };
  },

  markMultiplePaid: async (lesson_ids) => {
    const data = getData();
    lesson_ids.forEach(id => {
      const lesson = data.lessons.find(l => l.id === parseInt(id));
      if (lesson) lesson.is_paid = true;
    });
    saveData(data);
    return { updated: lesson_ids.length };
  }
};

// Payments API
export const paymentsApi = {
  getAll: async (params = {}) => {
    const data = getData();
    let payments = data.payments.map(p => {
      const student = data.students.find(s => s.id === p.student_id);
      const lessons = data.lessons.filter(l => p.lesson_ids?.includes(l.id));
      return { ...p, student_name: student?.name || 'Unknown', lessons };
    });

    if (params.student_id) {
      payments = payments.filter(p => p.student_id === parseInt(params.student_id));
    }

    return payments.sort((a, b) => new Date(b.date) - new Date(a.date));
  },

  create: async ({ student_id, amount, date, notes, lesson_ids }) => {
    const data = getData();

    const payment = {
      id: getNextId(),
      student_id: parseInt(student_id),
      amount,
      date,
      notes: notes || null,
      lesson_ids: lesson_ids || [],
      created_at: new Date().toISOString()
    };
    data.payments.push(payment);

    // Mark lessons as paid
    if (lesson_ids) {
      lesson_ids.forEach(id => {
        const lesson = data.lessons.find(l => l.id === parseInt(id));
        if (lesson) lesson.is_paid = true;
      });
    }

    saveData(data);

    const student = data.students.find(s => s.id === parseInt(student_id));
    const lessons = data.lessons.filter(l => lesson_ids?.includes(l.id));
    return { ...payment, student_name: student?.name, lessons };
  },

  delete: async (id, unmark_lessons = false) => {
    const data = getData();
    const payment = data.payments.find(p => p.id === parseInt(id));

    if (unmark_lessons && payment?.lesson_ids) {
      payment.lesson_ids.forEach(lid => {
        const lesson = data.lessons.find(l => l.id === lid);
        if (lesson) lesson.is_paid = false;
      });
    }

    data.payments = data.payments.filter(p => p.id !== parseInt(id));
    saveData(data);
  }
};

// Dashboard API
export const dashboardApi = {
  getStats: async () => {
    const data = getData();
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const unpaidLessons = data.lessons.filter(l => !l.is_paid);
    const monthLessons = data.lessons.filter(l => {
      const d = new Date(l.date);
      return d >= monthStart && d < monthEnd;
    });
    const paidMonthLessons = monthLessons.filter(l => l.is_paid);

    return {
      totalStudents: data.students.length,
      totalLessons: data.lessons.length,
      unpaidLessons: unpaidLessons.length,
      unpaidAmount: unpaidLessons.reduce((sum, l) => sum + (l.hourly_rate * l.duration_minutes / 60), 0),
      monthlyEarnings: paidMonthLessons.reduce((sum, l) => sum + (l.hourly_rate * l.duration_minutes / 60), 0),
      monthlyLessons: monthLessons.length
    };
  },

  getRecentLessons: async () => {
    const data = getData();
    return data.lessons
      .map(l => {
        const student = data.students.find(s => s.id === l.student_id);
        return { ...l, student_name: student?.name || 'Unknown' };
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 10);
  },

  getUnpaidByStudent: async () => {
    const data = getData();
    const unpaidByStudent = {};

    data.lessons.filter(l => !l.is_paid).forEach(l => {
      if (!unpaidByStudent[l.student_id]) {
        const student = data.students.find(s => s.id === l.student_id);
        unpaidByStudent[l.student_id] = {
          id: l.student_id,
          name: student?.name || 'Unknown',
          unpaid_count: 0,
          unpaid_amount: 0
        };
      }
      unpaidByStudent[l.student_id].unpaid_count++;
      unpaidByStudent[l.student_id].unpaid_amount += l.hourly_rate * l.duration_minutes / 60;
    });

    return Object.values(unpaidByStudent).sort((a, b) => b.unpaid_amount - a.unpaid_amount);
  },

  getMonthlySummary: async () => {
    const data = getData();
    const byMonth = {};

    data.lessons.forEach(l => {
      const month = l.date.substring(0, 7);
      if (!byMonth[month]) {
        byMonth[month] = { month, lesson_count: 0, paid_amount: 0, unpaid_amount: 0, total_amount: 0 };
      }
      const amount = l.hourly_rate * l.duration_minutes / 60;
      byMonth[month].lesson_count++;
      byMonth[month].total_amount += amount;
      if (l.is_paid) {
        byMonth[month].paid_amount += amount;
      } else {
        byMonth[month].unpaid_amount += amount;
      }
    });

    return Object.values(byMonth).sort((a, b) => b.month.localeCompare(a.month)).slice(0, 12);
  },

  getUpcomingLessons: async () => {
    const data = getData();
    const upcoming = await schedulesApi.getUpcoming(7);
    return upcoming;
  }
};

// Schedules API
export const schedulesApi = {
  getAll: async () => {
    const data = getData();
    if (!data.schedules) {
      data.schedules = [];
      saveData(data);
    }
    return data.schedules.map(s => {
      const student = data.students.find(st => st.id === s.student_id);
      return { ...s, student_name: student?.name || 'Unknown' };
    });
  },

  getUpcoming: async (days = 14) => {
    const data = getData();
    if (!data.schedules) {
      data.schedules = [];
      saveData(data);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + days);

    const upcoming = [];
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

    // Generate occurrences for each schedule
    data.schedules.forEach(schedule => {
      const student = data.students.find(s => s.id === schedule.student_id);

      if (schedule.is_recurring) {
        // Generate all occurrences in the date range
        let checkDate = new Date(today);
        while (checkDate <= endDate) {
          if (dayNames[checkDate.getDay()] === schedule.day_of_week) {
            upcoming.push({
              ...schedule,
              student_name: student?.name || 'Unknown',
              date: checkDate.toISOString().split('T')[0],
              is_recurring_instance: true
            });
          }
          checkDate.setDate(checkDate.getDate() + 1);
        }
      } else {
        // One-off scheduled lesson
        const scheduleDate = new Date(schedule.date);
        if (scheduleDate >= today && scheduleDate <= endDate) {
          upcoming.push({
            ...schedule,
            student_name: student?.name || 'Unknown',
            is_recurring_instance: false
          });
        }
      }
    });

    // Sort by date and time
    upcoming.sort((a, b) => {
      const dateCompare = a.date.localeCompare(b.date);
      if (dateCompare !== 0) return dateCompare;
      return a.time.localeCompare(b.time);
    });

    return upcoming;
  },

  create: async ({ student_id, is_recurring, day_of_week, date, time, duration_minutes, notes }) => {
    const data = getData();
    if (!data.schedules) data.schedules = [];

    const schedule = {
      id: getNextId(),
      student_id: parseInt(student_id),
      is_recurring: !!is_recurring,
      day_of_week: is_recurring ? day_of_week : null,
      date: is_recurring ? null : date,
      time,
      duration_minutes: duration_minutes || 60,
      notes: notes || null,
      created_at: new Date().toISOString()
    };

    data.schedules.push(schedule);
    saveData(data);

    const student = data.students.find(s => s.id === parseInt(student_id));
    return { ...schedule, student_name: student?.name };
  },

  update: async (id, { student_id, is_recurring, day_of_week, date, time, duration_minutes, notes }) => {
    const data = getData();
    if (!data.schedules) data.schedules = [];

    const index = data.schedules.findIndex(s => s.id === parseInt(id));
    if (index === -1) throw new Error('Schedule not found');

    data.schedules[index] = {
      ...data.schedules[index],
      student_id: parseInt(student_id),
      is_recurring: !!is_recurring,
      day_of_week: is_recurring ? day_of_week : null,
      date: is_recurring ? null : date,
      time,
      duration_minutes: duration_minutes || 60,
      notes: notes || null
    };

    saveData(data);
    const student = data.students.find(s => s.id === parseInt(student_id));
    return { ...data.schedules[index], student_name: student?.name };
  },

  delete: async (id) => {
    const data = getData();
    if (!data.schedules) data.schedules = [];
    data.schedules = data.schedules.filter(s => s.id !== parseInt(id));
    saveData(data);
  },

  // Convert a scheduled lesson to an actual lesson record
  completeLesson: async (scheduleId, date, notes) => {
    const data = getData();
    const schedule = data.schedules?.find(s => s.id === parseInt(scheduleId));
    if (!schedule) throw new Error('Schedule not found');

    const student = data.students.find(s => s.id === schedule.student_id);

    // Create the lesson
    const lesson = {
      id: getNextId(),
      student_id: schedule.student_id,
      date: date,
      duration_minutes: schedule.duration_minutes,
      hourly_rate: student?.hourly_rate || 30,
      notes: notes || schedule.notes || null,
      is_paid: false,
      created_at: new Date().toISOString()
    };

    data.lessons.push(lesson);

    // If it's a one-off, remove the schedule
    if (!schedule.is_recurring) {
      data.schedules = data.schedules.filter(s => s.id !== parseInt(scheduleId));
    }

    saveData(data);
    return { ...lesson, student_name: student?.name };
  }
};
