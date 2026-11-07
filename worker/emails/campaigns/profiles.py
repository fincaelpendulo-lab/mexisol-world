# One newsletter per guest profile (GHL tags profile_*), same look as the website-workflow emails.
# The profiles come from the MexiSoul Guest Profiles analysis. No medical or substance details here:
# each email speaks to what the group is looking for, not to why.
# Run: python3 worker/emails/campaigns/profiles.py [--today YYYY-MM-DD]
import importlib.util, os

HERE = os.path.dirname(os.path.abspath(__file__))
spec = importlib.util.spec_from_file_location('web', os.path.join(HERE, '../web/build.py'))
w = importlib.util.module_from_spec(spec); spec.loader.exec_module(w)

def dates(medicines, n=4, es=False):
    """The next n Finca retreats of the given kinds, as calendar rows."""
    picked = [r for r in w.finca_next if r['medicine'] in medicines][:n]
    out = []
    for r in picked:
        href = w.SITE + (ES_PAGE.get(r['medicine'], '/es/proximos-retiros') if es else w.PAGE.get(r['medicine'], '/upcoming-retreats'))
        out.append((ES_TITLE.get(r['medicine'], r['title']) if es else r['title'], f"{w.when(r)} &middot; {w.guide(r)}", href))
    return w.rows(out)

ES_PAGE = {'ayahuasca': '/es/retiro-de-ayahuasca', 'psilocybin': '/es/retiro-de-psilocibina', 'wellness': '/es/retiro-sitka-sol',
           'women': '/es/retiro-de-mujeres', 'newyear': '/es/ano-nuevo', 'familia-sagrada': '/es/finca-el-pendulo'}
ES_TITLE = {'ayahuasca': 'Retiro de ayahuasca', 'psilocybin': 'Retiro de psilocibina', 'newyear': 'Año Nuevo en la Finca',
            'familia-sagrada': 'Retiro Familia Sagrada', 'wellness': 'Retiro de bienestar Sitka &amp; Sol', 'women': 'Retiro de mujeres'}

def call_block(title='Talk it through with us', text='A free 30-minute call with our team. No pressure, just a conversation about where you are and what could help.'):
    return w.section(w.label('WHEN YOU ARE READY', color=w.OCHRE) + w.h2(title, color='#ffffff') + w.p(text, color='#ffffff', mb=24)
                     + w.button('Schedule a call', w.CALL, dark=True), bg=w.FOREST)

def ideas(items):
    """Short titled ideas, one per row."""
    return ''.join(f'<p style="margin:0 0 4px;{w.DISPLAY}font-size:20px;line-height:1.3;">{t}</p>\n' + w.p(b, size=16, mb=20) for t, b in items)

def calendar_link(es=False):
    href, text = (w.SITE + '/es/proximos-retiros', 'Ver el calendario completo') if es else (w.SITE + '/upcoming-retreats', 'See the full calendar')
    return f'<p style="margin:20px 0 0;font-size:15px;"><a href="{href}" style="color:{w.SLATE};">{text}</a></p>\n'

AYA_PSI = ('ayahuasca', 'psilocybin')
N = {}

# 1 · Healing Seeker
N['01-healing-seeker'] = ('profile_healing_seeker', 'Healing is not a straight line', 'Newsletter - Profile 1 Healing Seeker',
  w.head('Healing is not a straight line', 'Some days feel lighter, some feel heavy. Both are part of it.')
  + w.hero('web-meditation-outdoors', 'Guests meditating together on the terrace', 'A NOTE FOR YOU', 'Healing is not a straight line', 'Some days feel lighter, some feel heavy. Both are part of it.')
  + w.section(w.p('Since you were with us, life has kept moving. Maybe some of what opened at the Finca is still with you. Maybe some of it faded, and that is normal.', mb=16)
     + w.p('Change rarely happens in one week. It grows from small moments of attention, repeated. Here are three that our guests come back to.', mb=24)
     + ideas([('Start the day outside', 'Five minutes of sun and air before your phone. Notice your feet on the ground and three things you can hear.'),
              ('Write one honest line', 'Each night, one sentence about how you really feel. No fixing, just naming it.'),
              ('Let someone in', 'Reach out to one person this week. Connection is part of the medicine.')]))
  + w.photo('home-candlelit-dinner-guests', 'Guests sharing a candlelit dinner')
  + w.section(w.label('IF YOU FEEL CALLED BACK') + w.h2('Upcoming retreats') + w.p('Seven days in a small group, held by the same team you know.', mb=20) + dates(AYA_PSI) + calendar_link())
  + call_block()
  + w.section(w.p('Be gentle with yourself. We are here when you need us.', mb=22) + w.sign())
  + w.foot())

# 2 · Crossroads
N['02-crossroads'] = ('profile_crossroads', 'When one chapter closes', 'Newsletter - Profile 2 Crossroads',
  w.head('When one chapter closes', 'Endings make room. A few questions to sit with as the year turns.')
  + w.hero('web-group-yoga-oracle', 'A group moving together at the Oracle', 'AS THE YEAR TURNS', 'When one chapter closes', 'Endings make room for what comes next.')
  + w.section(w.p('Many of our guests arrive at a turning point. A relationship ends, work changes, someone is gone, or life simply asks for something new.', mb=16)
     + w.p('The end of the year is a good moment to pause and listen. Three questions to take with you on a quiet walk:', mb=24)
     + ideas([('What am I ready to leave behind?', 'Not what you should drop. What you are ready to.'),
              ('What gave me energy this year?', 'Small things count. Follow them.'),
              ('What would I do if I trusted myself?', 'Write the first answer that comes, before the doubts arrive.')]))
  + w.photo('web-group-terrace', 'A group of guests together on the terrace')
  + w.section(w.label('A FRESH START AT THE FINCA') + w.h2('New beginnings, coming up') + w.p('Close the year by the fire or start the next one with a week for yourself.', mb=20)
     + dates(('newyear', 'wellness', 'ayahuasca', 'psilocybin')) + calendar_link())
  + call_block('Not sure what is next?', 'A free 30-minute call to talk about where you are and whether a retreat fits this moment.')
  + w.section(w.p('Whatever this chapter holds, you do not have to walk it alone.', mb=22) + w.sign())
  + w.foot())

# 3 · Pattern Breaker
N['03-pattern-breaker'] = ('profile_pattern_breaker', 'Small choices, new paths', 'Newsletter - Profile 3 Pattern Breaker',
  w.head('Small choices, new paths', 'Old habits were learned. New ones can be too.')
  + w.hero('guests-setting-out-on-a-horseback', 'Guests setting out on a horseback ride', 'STEP BY STEP', 'Small choices, new paths', 'Old habits were learned. New ones can be too.')
  + w.section(w.p('Every routine you have today started as a choice you repeated. That is good news: it means the next routine is also yours to build.', mb=16)
     + w.p('You do not need a big plan. You need one next step, and people around you who believe in it. A few that help:', mb=24)
     + ideas([('Own the first hour', 'Water, movement and a few deep breaths before anything else. Win the morning and the day gets easier.'),
              ('Change the setting', 'A new walk, a new place for coffee, a new seat. Fresh surroundings make fresh choices easier.'),
              ('Find your people', 'Spend time with those who support the person you are becoming.')]))
  + w.photo('home-temazcal-greeting', 'Guests greeting the morning by the temazcal')
  + w.section(w.label('A WEEK TO RESET') + w.h2('Upcoming retreats') + w.p('Clean food, early mornings, nature, ceremony and a group walking the same way. Seven days to remember what you are capable of.', mb=20)
     + dates(AYA_PSI) + calendar_link())
  + call_block()
  + w.section(w.p('One step at a time. We are cheering for you.', mb=22) + w.sign())
  + w.foot())

# 4 · Returning Journeyer
N['04-returning-journeyer'] = ('profile_returning_journeyer', 'The path keeps opening', 'Newsletter - Profile 4 Returning Journeyer',
  w.head('The path keeps opening', 'What is new at the Finca for 2027, and a few ways to keep your practice alive.')
  + w.hero('mexisol-community-welcome', 'The MexiSol community gathered at the Finca', 'FOR OUR COMMUNITY', 'The path keeps opening', 'What is new at the Finca for 2027.')
  + w.section(w.p('You have sat in the circle with us. You know a retreat is not the end of the work but a doorway into it.', mb=16)
     + w.p('Keeping the thread alive between journeys is what turns insight into change:', mb=24)
     + ideas([('Return to your intention', 'Read what you wrote before your last ceremony. What has shifted? What is still asking for attention?'),
              ('Keep a daily practice', 'Meditation, breath, movement or prayer. Ten minutes held every day goes further than an hour now and then.'),
              ('Share what you learned', 'Tell one person what the medicine showed you. Saying it out loud helps it land.')]))
  + w.two_photos('web-temazcal-smudging', 'A smudging ceremony before the temazcal', 'guests-painting-and-working-with-clay', 'Guests painting and working with clay')
  + w.section(w.label('GOING DEEPER IN 2027') + w.h2('Ceremonies and gatherings') + w.p('Ayahuasca with Humberto, psilocybin with Krista, and Familia Sagrada during Holy Week with the Medicine and Music Festival.', mb=20)
     + dates(('ayahuasca', 'psilocybin', 'familia-sagrada'), n=5) + calendar_link())
  + call_block('Ready to return?', 'A free 30-minute call to choose the retreat and medicine that fit where you are now.')
  + w.section(w.p('Thank you for being part of this community. We hope to see you in the circle again.', mb=22) + w.sign())
  + w.foot())

# 5 · Caregiver
N['05-caregiver'] = ('profile_caregiver', 'Who takes care of you?', 'Newsletter - Profile 5 Caregiver',
  w.head('Who takes care of you?', 'You hold space for so many people. This one is for you.')
  + w.hero('sitka-kitchen-serving', 'Our kitchen team serving a meal', 'FOR THOSE WHO CARE FOR OTHERS', 'Who takes care of you?', 'You hold space for so many people. This one is for you.')
  + w.section(w.p('Many of our guests spend their days caring for others: patients, clients, students, families. They are often the last to rest.', mb=16)
     + w.p('Receiving care is not a luxury. It is how you keep giving. Three small permissions for this month:', mb=24)
     + ideas([('Close the day on purpose', 'A short ritual when work ends: wash your hands, change clothes, step outside. Let the day stay at the door.'),
              ('Say no once', 'One thing this week you let go of without explaining. Notice how it feels.'),
              ('Let yourself be held', 'A massage, a long meal with a friend, an afternoon with nowhere to be.')]))
  + w.photo('guests-sitting-and-swimming-at-lake', 'Guests resting together by the lake')
  + w.section(w.label('A WEEK WHERE SOMEONE ELSE HOLDS THE SPACE') + w.h2('Upcoming retreats') + w.p('Every meal, every ceremony and every detail taken care of, so you only have to show up.', mb=20)
     + dates(('wellness', 'ayahuasca', 'psilocybin')) + calendar_link())
  + call_block()
  + w.section(w.p('You give so much. Let it come back to you.', mb=22) + w.sign())
  + w.foot())

# 6 · Psilocybin-Curious Woman
N['06-psilocybin-curious'] = ('profile_psilocybin_curious', 'A softer way in', 'Newsletter - Profile 6 Psilocybin Curious',
  w.head('A softer way in', 'Psilocybin with Krista, a women\'s circle this month and the 2027 dates.')
  + w.hero('women-circle-under-palapa', 'A women\'s circle under the palapa', 'PSILOCYBIN AT THE FINCA', 'A softer way in', 'Reconnect with your body, your intuition and the women around you.')
  + w.section(w.p('Psilocybin has a gentle, earthy way of opening the heart. Many women tell us it helped them hear their own voice again.', mb=16)
     + w.p('Our psilocybin retreats are led by Krista, with a small group, a calm rhythm and time in nature between ceremonies. Three ways to stay connected until then:', mb=24)
     + ideas([('Listen to your body', 'Before deciding, pause and ask where you feel it. Your body often knows first.'),
              ('Gather with women', 'A circle, a walk, a shared meal. We heal faster in good company.'),
              ('Create a small altar', 'Flowers, a candle, something from nature. A place to return to yourself each day.')]))
  + w.photo('women-long-dinner', 'Women sharing a long dinner by candlelight')
  + w.section(w.label('COMING UP') + w.h2('Psilocybin and women\'s retreats') + w.p('Seven days and six nights, all meals and lodging included.', mb=20)
     + dates(('women', 'psilocybin'), n=4) + calendar_link())
  + call_block('Questions about psilocybin?', 'A free 30-minute call with our team. Ask anything about the medicine, the group and how we prepare you.')
  + w.section(w.p('We would love to sit in circle with you again.', mb=22) + w.sign())
  + w.foot())

# 7 · Local Seeker (Spanish)
ES_SIGN = w.p('Con cariño,', mb=4) + f'<p style="margin:0;{w.DISPLAY}font-size:20px;line-height:1.3;">Humberto, Krista, Marina y el equipo de MexiSol World</p>\n'
ES_FOOT = (w.foot().replace('>RETREATS<', '>RETIROS<').replace('>WEBSITE<', '>SITIO WEB<').replace('UNSUBSCRIBE', 'DARSE DE BAJA')
           .replace(f'{w.SITE}/upcoming-retreats', f'{w.SITE}/es/proximos-retiros'))
ES_CALL = w.SITE + '/es/agenda-una-llamada'
ES_WA = w.WA + '?text=' + 'Hola%2C%20quiero%20informaci%C3%B3n%20sobre%20los%20retiros%20en%20la%20Finca'
N['07-local-seeker'] = ('profile_local_seeker', 'Tu lugar está cerca', 'Newsletter - Perfil 7 Local Seeker (ES)',
  w.head('Tu lugar está cerca', 'Año Nuevo en la Finca, Semana Santa y los retiros de 2027 en Jalisco.').replace('<html lang="en">', '<html lang="es">')
  + w.hero('web-river-group', 'Un grupo de huéspedes junto al río', 'FINCA EL PÉNDULO &middot; JALISCO', 'Tu lugar está cerca', 'A una hora de Guadalajara, en Tepatitlán.', 'Ver Año Nuevo', w.SITE + '/es/ano-nuevo')
  + w.section(w.p('No hace falta cruzar el continente para reencontrarte. La medicina, el temazcal y la comunidad están aquí, en Los Altos de Jalisco.', mb=16)
     + w.p('Este fin de año abrimos la Finca para cerrar el ciclo juntos, con tres opciones y precios en pesos:', mb=24)
     + ideas([('Retiro de Año Nuevo', '28 de diciembre al 2 de enero &middot; desde $9,350 MXN. Temazcal, yoga, kambo, círculos de fuego y ceremonia el 31.'),
              ('Ceremonia y celebración', '31 de diciembre al 2 de enero &middot; desde $4,750 MXN. Ceremonia, cena de Año Nuevo y fogata.'),
              ('Celebración de Año Nuevo', '31 de diciembre al 1 de enero &middot; desde $1,650 MXN. Cena, fogata y concierto, sin ceremonia.')])
     + '<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td>' + w.button('Reservar por WhatsApp', ES_WA, dark=True) + '</td></tr></table>\n', bg='#f5f3ee')
  + w.photo('guests-sharing-a-candlelit-dinner-at', 'Cena a la luz de las velas en la Finca')
  + w.section(w.label('PRÓXIMAS FECHAS EN LA FINCA') + w.h2('Retiros 2027') + w.p('Siete días en grupo pequeño, con comida, hospedaje y ceremonias incluidos. En Semana Santa, Familia Sagrada con el Festival de Medicina y Música.', mb=20)
     + dates(('ayahuasca', 'psilocybin', 'familia-sagrada'), n=5, es=True) + calendar_link(es=True))
  + w.section(w.label('¿TIENES DUDAS?', color=w.OCHRE) + w.h2('Platiquemos', color='#ffffff') + w.p('Una llamada gratuita de 30 minutos con nuestro equipo, en español, para ver qué opción va contigo.', color='#ffffff', mb=24)
     + w.button('Agendar una llamada', ES_CALL, dark=True), bg=w.FOREST)
  + w.section(w.p('Te esperamos en casa.', mb=22) + ES_SIGN)
  + ES_FOOT)

if __name__ == '__main__':
    for name, (tag, subject, ghl_name, html) in N.items():
        open(os.path.join(HERE, 'profile-' + name + '.html'), 'w').write(html)
        print(f'{name}: tag {tag}, subject: {subject}')
