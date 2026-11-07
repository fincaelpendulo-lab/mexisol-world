# One-off email campaigns, same look as the website-workflow emails (helpers from ../web/build.py).
# Run: python3 worker/emails/campaigns/build.py [--today YYYY-MM-DD]
# Writes one HTML file per campaign next to this script and prints the subject.
import importlib.util, os

HERE = os.path.dirname(os.path.abspath(__file__))
spec = importlib.util.spec_from_file_location('web', os.path.join(HERE, '../web/build.py'))
w = importlib.util.module_from_spec(spec); spec.loader.exec_module(w)

NY_PAGE = w.SITE + '/new-year-retreat'
NY_WA = w.WA + '?text=' + "Hi%2C%20I%27d%20like%20to%20book%20New%20Year%202027%20at%20Finca%20El%20P%C3%A9ndulo"

# The three New Year packages, as on /new-year-retreat (src/components/pages/NewYear.astro).
ny_packages = [
    ('New Year Retreat', 'December 28 to January 2 &middot; 5 nights &middot; from $9,350 MXN per person',
     'Voice activation, yoga, temazcal, cold plunge, kambo and fire circles, then an ayahuasca ceremony on the 31st and New Year dinner with a bonfire and song.'),
    ("New Year's Eve Ceremony and Celebration", 'December 31 to January 2 &middot; 2 nights &middot; from $4,750 MXN per person',
     'An ayahuasca ceremony, New Year dinner with a bonfire and song, and a slow first day of the year with myths and mantras.'),
    ('New Year Celebration', 'December 31 to January 1 &middot; 1 night &middot; from $1,650 MXN per person',
     'New Year dinner, a bonfire celebration and a concert. No ceremony.'),
]
pkg_html = f'<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-bottom:1px solid {w.LINE};">\n' + ''.join(
    f'<tr><td style="padding:18px 0;border-top:1px solid {w.LINE};"><span style="{w.DISPLAY}font-size:22px;">{n}</span><br>'
    f'<span style="font-size:14px;color:{w.FOREST};">{d}</span><br><span style="font-size:15px;line-height:1.55;">{t}</span></td></tr>\n'
    for n, d, t in ny_packages) + '</table>\n'

# Every Finca retreat after New Year that has not started yet.
later = [r for r in w.finca_next if r['medicine'] != 'newyear']
date_rows = [(r['title'], f"{w.when(r)} &middot; {w.guide(r)}", w.SITE + w.PAGE.get(r['medicine'], '/upcoming-retreats')) for r in later]

campaigns = {}
campaigns['2026-11-new-year-and-dates'] = ('Ring in 2027 at Finca El Péndulo',
  w.head('New Year at Finca El Péndulo', 'Three ways to close the year with us, December 28 to January 2. Plus every retreat date coming up.')
  + w.hero('fire-circle-at-night', 'Fire circle at night at Finca El Péndulo', 'NEW YEAR 2027 &middot; FINCA EL PÉNDULO', 'Ring in 2027 with us', 'Three ways to close the year in Jalisco, December 28 to January 2.', 'See the packages', NY_PAGE)
  + w.section(w.label('NEW YEAR AT THE FINCA') + w.h2('Choose how you close the year') + w.p('Lodging and activities are included in every package. Prices are per person in Mexican pesos and depend on your room.', mb=20) + pkg_html
     + '<p style="margin:24px 0 0;"></p>\n' + '<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding:0 10px 10px 0;">' + w.button('Book on WhatsApp', NY_WA, dark=True)
     + f'</td><td style="padding:0 0 10px 0;"><table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td style="border:1px solid {w.FOREST};"><a href="{NY_PAGE}" style="display:inline-block;padding:14px 24px;font-size:15px;color:{w.FOREST};text-decoration:none;">All prices and rooms</a></td></tr></table></td></tr></table>\n'
     + w.p(f'The retreat and the ceremony package include ayahuasca. As always, we review your health and medications before confirming your place (<a href="{w.SITE}/medical" style="color:{w.SLATE};">read why</a>).', color=w.MUTED, size=14, mb=0), bg='#f5f3ee')
  + w.photo('guests-sharing-a-candlelit-dinner-at', 'Guests sharing a candlelit dinner at the Finca')
  + w.section(w.label('MORE DATES AT THE FINCA') + w.h2('Retreats coming up') + w.p('Our ayahuasca and psilocybin retreats run seven days and six nights for up to 15 guests, with every meal, ceremony and room included. From $1,850 USD per person.', mb=20) + w.rows(date_rows)
     + f'<p style="margin:20px 0 0;font-size:15px;"><a href="{w.SITE}/upcoming-retreats" style="color:{w.SLATE};">See the full calendar</a></p>\n')
  + w.section(w.label('NOT SURE WHICH ONE?', color=w.OCHRE) + w.h2('Schedule a free call', color='#ffffff') + w.p('Thirty minutes with our team to talk about your health, your intention and the dates that fit you.', color='#ffffff', mb=24) + w.button('Schedule a call', w.CALL, dark=True), bg=w.FOREST)
  + w.section(w.p('We would love to start the year with you.', mb=22) + w.sign())
  + w.foot())

for name, (subject, html) in campaigns.items():
    open(os.path.join(HERE, name + '.html'), 'w').write(html)
    print(f'{name}: {len(html)} chars, subject: {subject}')
