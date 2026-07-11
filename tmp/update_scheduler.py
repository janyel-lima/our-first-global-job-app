import os

path = 'src/components/scheduler/ClassScheduler.vue'
if os.path.exists(path):
    with open(path, 'r', encoding='utf-8') as f:
        text = f.read()

    # 1. Weekly Card Block Target
    weekly_target = """                  <div class="flex items-center justify-between gap-1 w-full overflow-hidden">
                    <span class="text-[10px] font-mono font-black flex items-center gap-0.5 shrink-0"><Clock class="w-3 h-3 text-blue-500" />{{ cl.scheduledAt.split(' ')[1] }}</span>
                    <span :class="[
                      'text-[8px] font-extrabold tracking-wider uppercase px-1 py-0.5 rounded-sm shrink-0',
                      cl.status === 'completed' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300' :
                      cl.status === 'cancelled' ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/45 dark:text-rose-350' :
                      cl.studentIds.includes(currentUserId) ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300' :
                      'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300'
                    ]">
                      {{ cl.status === 'completed' ? 'Fim' : cl.status === 'cancelled' ? 'Canc' : cl.studentIds.includes(currentUserId) ? 'Insc' : 'Disp' }}
                    </span>
                  </div>
                  <h5 class="text-[11px] font-extrabold line-clamp-1 leading-tight">{{ cl.courseTitle }}</h5>
                  <p class="text-[9px] text-gray-400 truncate">Prof: {{ cl.instructorName }}</p>
                  <div class="mt-1 pt-1 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between text-[9px] text-gray-450 dark:text-gray-400 font-semibold w-full overflow-hidden">
                    <span class="flex items-center gap-0.5 shrink-0"><Users class="w-2.5 h-2.5" />{{ cl.studentIds.length }}/{{ cl.maxStudents }}</span>
                    <span v-if="cl.studentIds.includes(currentUserId)" class="text-amber-600 dark:text-amber-400 font-extrabold shrink-0">★ Inscrito</span>
                  </div>"""

    weekly_replacement = """                  <div class="flex items-center justify-between gap-1 w-full overflow-hidden">
                    <span 
                      class="text-[10px] font-mono font-black flex items-center gap-0.5 shrink-0"
                      :class="cl.status === 'scheduled' ? 'text-white' : 'text-slate-700 dark:text-slate-300'"
                    >
                      <Clock class="w-3.5 h-3.5" :class="cl.status === 'scheduled' ? 'text-blue-100' : 'text-blue-500'" />
                      {{ cl.scheduledAt.split(' ')[1] }}
                    </span>
                    <span :class="[
                      'text-[8px] font-extrabold tracking-wider uppercase px-1 py-0.5 rounded-sm shrink-0',
                      cl.status === 'completed' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300' :
                      cl.status === 'cancelled' ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/45 dark:text-rose-350' :
                      cl.studentIds.includes(currentUserId) ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300' :
                      cl.status === 'scheduled' ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300'
                    ]">
                      {{ cl.status === 'completed' ? 'Fim' : cl.status === 'cancelled' ? 'Canc' : cl.studentIds.includes(currentUserId) ? 'Insc' : 'Disp' }}
                    </span>
                  </div>
                  <h5 class="text-[11px] font-extrabold line-clamp-1 leading-tight">{{ cl.courseTitle }}</h5>
                  <p 
                    class="text-[9px] truncate"
                    :class="cl.status === 'scheduled' ? 'text-blue-100/95 font-bold' : 'text-gray-400'"
                  >
                    Prof: {{ cl.instructorName }}
                  </p>
                  <div 
                    class="mt-1 pt-1 border-t flex items-center justify-between text-[9px] font-semibold w-full overflow-hidden"
                    :class="cl.status === 'scheduled' ? 'border-white/20 text-blue-50' : 'border-gray-100 dark:border-slate-800 text-gray-450 dark:text-gray-400'"
                  >
                    <span class="flex items-center gap-0.5 shrink-0"><Users class="w-2.5 h-2.5" />{{ cl.studentIds.length }}/{{ cl.maxStudents }}</span>
                    <span v-if="cl.studentIds.includes(currentUserId)" :class="cl.status === 'scheduled' ? 'text-amber-300 font-extrabold shrink-0' : 'text-amber-600 dark:text-amber-400 font-extrabold shrink-0'">★ Inscrito</span>
                  </div>"""

    # 2. Daily Detail Card Block Target (lines 1460 to 1475)
    daily_target = """              <div class="flex items-center justify-between gap-1">
                <span class="text-[10px] font-mono font-black flex items-center gap-1" :class="cl.status === 'scheduled' ? 'text-white/90' : 'text-gray-600 dark:text-gray-350'">
                  <Clock class="w-3.5 h-3.5" :class="cl.status === 'scheduled' ? 'text-white' : 'text-blue-500'" />
                  {{ cl.scheduledAt.split(' ')[1] }}
                </span>
                <span :class="['text-[8px] font-extrabold tracking-wider uppercase px-1.5 py-0.5 rounded-sm', cl.status === 'completed' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300' : cl.status === 'cancelled' ? 'bg-rose-100 text-rose-855 dark:bg-rose-950/45 dark:text-rose-355' : 'bg-white/25 text-white']">
                  {{ cl.status === 'completed' ? (locale === 'pt' ? 'Fim' : 'Ended') : cl.status === 'cancelled' ? (locale === 'pt' ? 'Canc' : 'Cancelled') : cl.studentIds.includes(currentUserId) ? (locale === 'pt' ? 'Inscrito' : 'Enrolled') : (locale === 'pt' ? 'Disponível' : 'Available') }}
                </span>
              </div>
              <h5 class="text-xs font-extrabold line-clamp-1 leading-snug" :class="cl.status === 'scheduled' ? 'text-white' : ''">{{ cl.courseTitle }}</h5>
              <p class="text-[10px]" :class="cl.status === 'scheduled' ? 'text-white/80' : 'text-gray-450 dark:text-gray-400'">
                {{ locale === 'pt' ? 'Professor:' : 'Instructor:' }} <strong class="font-bold" :class="cl.status === 'scheduled' ? 'text-white' : 'text-gray-600 dark:text-gray-300'">{{ cl.instructorName }}</strong>
              </p>
              <div class="mt-2 pt-2 flex items-center justify-between text-[10px] font-semibold" :class="cl.status === 'scheduled' ? 'border-white/15 text-white/80' : 'border-gray-150/60 dark:border-slate-850 text-gray-400'">"""

    # Look at exact contents of daily_target in the file around line 1465, to be safe, let's read the file and replace parts of it.
    daily_replacement = """              <div class="flex items-center justify-between gap-1">
                <span class="text-[10px] font-mono font-black flex items-center gap-1" :class="cl.status === 'scheduled' ? 'text-white' : 'text-slate-700 dark:text-slate-300'">
                  <Clock class="w-3.5 h-3.5" :class="cl.status === 'scheduled' ? 'text-blue-100' : 'text-blue-500'" />
                  {{ cl.scheduledAt.split(' ')[1] }}
                </span>
                <span :class="['text-[8px] font-extrabold tracking-wider uppercase px-1.5 py-0.5 rounded-sm', cl.status === 'completed' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300' : cl.status === 'cancelled' ? 'bg-rose-100 text-rose-855 dark:bg-rose-950/45 dark:text-rose-355' : 'bg-white/25 text-white']">
                  {{ cl.status === 'completed' ? (locale === 'pt' ? 'Fim' : 'Ended') : cl.status === 'cancelled' ? (locale === 'pt' ? 'Canc' : 'Cancelled') : cl.studentIds.includes(currentUserId) ? (locale === 'pt' ? 'Inscrito' : 'Enrolled') : (locale === 'pt' ? 'Disponível' : 'Available') }}
                </span>
              </div>
              <h5 class="text-xs font-extrabold line-clamp-1 leading-snug" :class="cl.status === 'scheduled' ? 'text-white' : ''">{{ cl.courseTitle }}</h5>
              <p class="text-[10px]" :class="cl.status === 'scheduled' ? 'text-white/80' : 'text-gray-450 dark:text-gray-400'">
                {{ locale === 'pt' ? 'Professor:' : 'Instructor:' }} <strong class="font-bold" :class="cl.status === 'scheduled' ? 'text-white' : 'text-gray-600 dark:text-gray-300'">{{ cl.instructorName }}</strong>
              </p>
              <div class="mt-2 pt-2 border-t flex items-center justify-between text-[10px] font-semibold" :class="cl.status === 'scheduled' ? 'border-white/15 text-white/80' : 'border-gray-150/60 dark:border-slate-850 text-gray-400'">"""

    replaced = False
    if weekly_target in text:
        text = text.replace(weekly_target, weekly_replacement)
        print("Weekly target replaced successfully!")
        replaced = True
    else:
        print("Weekly target NOT found. Let's do a substring match.")
        # fallback substring replace
        sub_weekly = '<Clock class="w-3 h-3 text-blue-500" />'
        if sub_weekly in text:
            text = text.replace(sub_weekly, '<Clock class="w-3.5 h-3.5" :class="cl.status === \'scheduled\' ? \'text-blue-100\' : \'text-blue-500\'" />')
            print("Sub-weekly replaced successfully.")
            replaced = True

    # Check daily target in text (and handle minor variance in string quotes / line breaks)
    # We will do a robust check
    if daily_target in text:
        text = text.replace(daily_target, daily_replacement)
        print("Daily target replaced successfully!")
        replaced = True
    else:
        # Fallback daily replacement
        sub_daily = ':class="[\'text-[8px]\''
        if sub_daily in text:
            # Let's replace just the key lines
            text = text.replace('font-mono font-black flex items-center gap-1" :class="cl.status === \'scheduled\' ? \'text-white/90\' : \'text-gray-600 dark:text-gray-350\'"', 'font-mono font-black flex items-center gap-1" :class="cl.status === \'scheduled\' ? \'text-white\' : \'text-slate-700 dark:text-slate-300\'"')
            text = text.replace('class="mt-2 pt-2 flex items-center justify-between text-[10px] font-semibold"', 'class="mt-2 pt-2 border-t flex items-center justify-between text-[10px] font-semibold"')
            print("Fallback daily replaced successfully.")
            replaced = True

    if replaced:
        with open(path, 'w', encoding='utf-8') as f:
            f.write(text)
        print("Scheduler updated successfully!")
    else:
        print("No matches found in ClassScheduler.vue!")
else:
    print("ClassScheduler.vue not found!")
