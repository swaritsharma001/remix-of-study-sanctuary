export interface Lecture {
  id: number;
  title: string;
  videoUrl: string;
  type: 'hls' | 'youtube';
}

export interface Chapter {
  id: number;
  title: string;
  lectures: Lecture[];
}

export interface Subject {
  slug: string;
  title: string;
  hasChapters: boolean;
  chapters?: Chapter[];
  lectures?: Lecture[];
}

export const mathsChapters: Chapter[] = [
  {
    id: 1,
    title: 'Real Numbers',
    lectures: [
      {
        id: 1,
        title: 'Introduction',
        videoUrl: 'https://youtu.be/_0ooaKrdubI',
        type: 'youtube',
      },
      {
        id: 2,
        title: 'Real Numbers – 2',
        videoUrl: 'https://d1qcficr3lu37x.cloudfront.net/file_library/videos/channel_vod_non_drm_hls/4351824/174473579119298296383/174473579119298296383_8296383.m3u8',
        type: 'hls',
      },
      {
        id: 3,
        title: 'Real Numbers – 3',
        videoUrl: 'https://d1qcficr3lu37x.cloudfront.net/file_library/videos/channel_vod_non_drm_hls/4354873/174499225616481097666/174499225616481097666_1097666.m3u8',
        type: 'hls',
      },
      {
        id: 4,
        title: 'Real Numbers – 4',
        videoUrl: 'https://d1qcficr3lu37x.cloudfront.net/file_library/videos/channel_vod_non_drm_hls/4355458/174508004648941097666/174508004648941097666_1097666.m3u8',
        type: 'hls',
      },
      {
        id: 5,
        title: 'Real Numbers – 5',
        videoUrl: 'https://d1qcficr3lu37x.cloudfront.net/file_library/videos/channel_vod_non_drm_hls/4356796/174525209654081097666/174525209654081097666_1097666.m3u8',
        type: 'hls',
      },
      {
        id: 6,
        title: 'Real Numbers – 6',
        videoUrl: 'https://d1qcficr3lu37x.cloudfront.net/file_library/videos/channel_vod_non_drm_hls/4357843/174533856999441097666/174533856999441097666_1097666.m3u8',
        type: 'hls',
      },
    ],
  },
  {
    id: 2,
    title: 'Polynomials',
    lectures: [
      {
        id: 1,
        title: 'Polynomials L1',
        videoUrl: 'https://d1qcficr3lu37x.cloudfront.net/file_library/videos/channel_vod_non_drm_hls/4361323/174559737034061097666/174559737034061097666_1097666.m3u8',
        type: 'hls',
      },
      {
        id: 2,
        title: 'Polynomials L2',
        videoUrl: 'https://d1qcficr3lu37x.cloudfront.net/file_library/videos/channel_vod_non_drm_hls/4362134/174568400490071097666/174568400490071097666_1097666.m3u8',
        type: 'hls',
      },
      {
        id: 3,
        title: 'Polynomials L3',
        videoUrl: 'https://d1qcficr3lu37x.cloudfront.net/file_library/videos/channel_vod_non_drm_hls/4363379/174585623134271097666/174585623134271097666_1097666.m3u8',
        type: 'hls',
      },
      {
        id: 4,
        title: 'Polynomials L4',
        videoUrl: 'https://d1qcficr3lu37x.cloudfront.net/file_library/videos/channel_vod_non_drm_hls/4364779/174594155534621097666/174594155534621097666_1097666.m3u8',
        type: 'hls',
      },
      {
        id: 5,
        title: 'Polynomials L5',
        videoUrl: 'https://d1qcficr3lu37x.cloudfront.net/file_library/videos/channel_vod_non_drm_hls/4368398/174620142857631097666/174620142857631097666_1097666.m3u8',
        type: 'hls',
      },
      {
        id: 6,
        title: 'Polynomials L6',
        videoUrl: 'https://d1qcficr3lu37x.cloudfront.net/file_library/videos/channel_vod_non_drm_hls/4370160/174628714218381097666/174628714218381097666_1097666.m3u8',
        type: 'hls',
      },
    ],
  },
  {
    id: 3,
    title: 'Pair of Linear Equations in Two Variables',
    lectures: [
      {
        id: 1,
        title: 'Linear Equations L1',
        videoUrl: 'https://d1qcficr3lu37x.cloudfront.net/file_library/videos/channel_vod_non_drm_hls/4372312/174646254284121097666/174646254284121097666_1097666.m3u8',
        type: 'hls',
      },
      {
        id: 2,
        title: 'Linear Equations L2',
        videoUrl: 'https://d1qcficr3lu37x.cloudfront.net/file_library/videos/channel_vod_non_drm_hls/4373921/174654659565961097666/174654659565961097666_1097666.m3u8',
        type: 'hls',
      },
      {
        id: 3,
        title: 'Linear Equations L3',
        videoUrl: 'https://d1qcficr3lu37x.cloudfront.net/file_library/videos/channel_vod_non_drm_hls/4377325/174680602725391097666/174680602725391097666_1097666.m3u8',
        type: 'hls',
      },
      {
        id: 4,
        title: 'Linear Equations L4',
        videoUrl: 'https://d1qcficr3lu37x.cloudfront.net/file_library/videos/channel_vod_non_drm_hls/4377995/174689370672401097666/174689370672401097666_1097666.m3u8',
        type: 'hls',
      },
      {
        id: 5,
        title: 'Linear Equations L5',
        videoUrl: 'https://d1qcficr3lu37x.cloudfront.net/file_library/videos/channel_vod_non_drm_hls/4379163/174706562215611097666/174706562215611097666_1097666.m3u8',
        type: 'hls',
      },
      {
        id: 6,
        title: 'Linear Equations L6',
        videoUrl: 'https://d1qcficr3lu37x.cloudfront.net/file_library/videos/channel_vod_non_drm_hls/4384128/174741081479871097666/174741081479871097666_1097666.m3u8',
        type: 'hls',
      },
      {
        id: 7,
        title: 'Linear Equations L7',
        videoUrl: 'https://d1qcficr3lu37x.cloudfront.net/file_library/videos/channel_vod_non_drm_hls/4384834/174749789730281097666/174749789730281097666_1097666.m3u8',
        type: 'hls',
      },
      {
        id: 8,
        title: 'Linear Equations L8',
        videoUrl: 'https://d1qcficr3lu37x.cloudfront.net/file_library/videos/channel_vod_non_drm_hls/4385006/174758500568421097666/174758500568421097666_1097666.m3u8',
        type: 'hls',
      },
    ],
  },
];

// Default lectures for subjects without chapters yet
export const defaultLectures: Lecture[] = [
  { id: 1, title: 'Introduction to the Subject', videoUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', type: 'hls' },
  { id: 2, title: 'Basic Concepts and Fundamentals', videoUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', type: 'hls' },
  { id: 3, title: 'Advanced Topics Part 1', videoUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', type: 'hls' },
  { id: 4, title: 'Advanced Topics Part 2', videoUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', type: 'hls' },
];

export const subjects: Record<string, Subject> = {
  hindi: {
    slug: 'hindi',
    title: 'Hindi',
    hasChapters: false,
    lectures: defaultLectures,
  },
  english: {
    slug: 'english',
    title: 'English',
    hasChapters: false,
    lectures: defaultLectures,
  },
  maths: {
    slug: 'maths',
    title: 'Maths',
    hasChapters: true,
    chapters: mathsChapters,
  },
  science: {
    slug: 'science',
    title: 'Science',
    hasChapters: false,
    lectures: defaultLectures,
  },
};

export const getSubject = (slug: string): Subject | undefined => {
  return subjects[slug];
};

export const getChapter = (subjectSlug: string, chapterId: number): Chapter | undefined => {
  const subject = subjects[subjectSlug];
  if (!subject?.chapters) return undefined;
  return subject.chapters.find(ch => ch.id === chapterId);
};

export const getLecture = (
  subjectSlug: string,
  lectureId: number,
  chapterId?: number
): { lecture: Lecture; chapter?: Chapter } | undefined => {
  const subject = subjects[subjectSlug];
  if (!subject) return undefined;

  if (subject.hasChapters && chapterId) {
    const chapter = subject.chapters?.find(ch => ch.id === chapterId);
    const lecture = chapter?.lectures.find(l => l.id === lectureId);
    if (lecture && chapter) return { lecture, chapter };
  } else if (!subject.hasChapters) {
    const lecture = subject.lectures?.find(l => l.id === lectureId);
    if (lecture) return { lecture };
  }

  return undefined;
};
