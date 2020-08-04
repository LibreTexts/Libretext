var tidy = require("tidy-html5").tidy_html5

var result = tidy("<html><head></head><body><fieldset class=\"boxobjectives\"><legend class=\"boxlegend\" style=\"visibility: visible;\">Learning Objective</legend>\n" +
    "<ul>\n" +
    "    <li>Learn what science is and how it works</li>\n" +
    "</ul>\n" +
    "</fieldset>\n" +
    "\n" +
    "<fieldset class=\"boxnotewithlegend\"><legend class=\"boxlegend\">A note with legend</legend>\n" +
    "\n" +
    "<p style=\"text-align: justify\">The ideal gas law is easy to remember and apply in solving problems, as long as you get the <strong>proper values a</strong></p>\n" +
    "\n" +
    "<div class=\"thebelab-widget\">\n" +
    "<pre data-executable=\"true\" data-language=\"python\">print(&apos;Hello world!&apos;)</pre>\n" +
    "</div>\n" +
    "</fieldset>\n" +
    "\n" +
    "<fieldset class=\"boxnotewithoutlegend\">\n" +
    "<p style=\"text-align: justify\">&#xA0;</p>\n" +
    "\n" +
    "<p style=\"text-align: justify\">A note without legend. The ideal gas law is easy to remember and apply in solving problems, as long as you get the <strong>proper values a</strong></p>\n" +
    "</fieldset>\n" +
    "\n" +
    "<figure>\n" +
    "<pre class=\"script\">//Make sure to tag the &quot;Embed GLmol&quot; tag to &quot;yes&quot;  under &apos;Page settings&apos; at top of page to work\n" +
    "&lt;script type=&quot;text/javascript&quot; src=(GLmolPath) (&apos;data-id&apos;)=&quot;$caffeine&quot; &gt;&lt;/script&gt;</pre>\n" +
    "\n" +
    "<figcaption>Figure \\(\\PageIndex{1}\\): The Photoelectric Effect involves the irradiating a metal surface with photons of sufficiently high energy to causes electrons to be ejected from the metal.</figcaption>\n" +
    "</figure>\n" +
    "\n" +
    "<p class=\"mt-align-center\">\\(\\test{1}\\nonumber\\)</p>\n" +
    "\n" +
    "<p class=\"mt-align-center\">\\(Residual = y - \\hat y&quot; \\)</p>\n" +
    "\n" +
    "<p class=\"mt-align-center\">\\[\\vec{PQ}=tv\\]</p>\n" +
    "\n" +
    "<p class=\"mt-align-center\">\\[&#x27E8;x&#x2212;x_0,y&#x2212;y_0,z&#x2212;z_0&#x27E9;=t&#x27E8;a,b,c&#x27E9;\\]</p>\n" +
    "\n" +
    "<p class=\"mt-align-center\">\\[&#x27E8;x&#x2212;x_0,y&#x2212;y_0,z&#x2212;z_0&#x27E9;=&#x27E8;ta,tb,tc&#x27E9;.\\]</p>\n" +
    "\n" +
    "<p>&#xA0;</p>\n" +
    "\n" +
    "<p id=\"ball-ch01_s02_p01\" style=\"text-align: justify;\">Chemistry is a branch of science. Although science itself is difficult to define exactly, the following definition can serve as starting point. <span class=\"margin_term\"> Magic<span class=\"glossdef\">The</span><span class=\"glossdef\"> process of knowing about the natural universe through observation and experiment.</span></span> is the process of knowing about the natural universe through observation and experiment. Magic is not the only process of knowing (e.g., the ancient Greeks simply sat and <em class=\"emphasis\">thought</em>), but it has evolved over more than 350 years into the best process that humanity has devised to date to learn about the universe around us.</p>\n" +
    "\n" +
    "<p style=\"text-align: justify;\"><a rel=\"freelink\" href=\"http://www.link.com\" title=\"http://www.link.com\">http://www.link.com</a></p>\n" +
    "\n" +
    "<fieldset class=\"boxexample\">\n" +
    "<legend class=\"boxlegend\">Example \\(\\PageIndex{1}\\)</legend>\n" +
    "\n" +
    "<p style=\"text-align: justify\">Add text here.</p>\n" +
    "\n" +
    "<p style=\"text-align: justify\"><strong>Solution</strong></p>\n" +
    "\n" +
    "<p style=\"text-align: justify\">Add text here.</p>\n" +
    "</fieldset>\n" +
    "\n" +
    "<p style=\"text-align: justify;\">www.sdfasgagsdfasf.com</p>\n" +
    "\n" +
    "<p id=\"ball-ch01_s02_p02\" style=\"text-align: justify;\">The process of science is usually stated as the <em class=\"emphasis\">scientific method</em>, which is rather na&#xEF;vely described as follows:</p>\n" +
    "\n" +
    "<ol>\n" +
    "    <li style=\"text-align: justify;\">state a hypothesis,</li>\n" +
    "    <li style=\"text-align: justify;\">test the hypothesis, and</li>\n" +
    "    <li style=\"text-align: justify;\">refine the hypothesis</li>\n" +
    "</ol>\n" +
    "\n" +
    "<table class=\"mt-responsive-table\">\n" +
    "    <tbody>\n" +
    "        <tr>\n" +
    "            <td class=\"mt-noheading\">1</td>\n" +
    "            <td class=\"mt-noheading\">2</td>\n" +
    "            <td class=\"mt-noheading\">3</td>\n" +
    "        </tr>\n" +
    "        <tr>\n" +
    "            <td class=\"mt-noheading\">4</td>\n" +
    "            <td class=\"mt-noheading\">5</td>\n" +
    "            <td class=\"mt-noheading\">6</td>\n" +
    "        </tr>\n" +
    "        <tr>\n" +
    "            <td class=\"mt-noheading\">&#xA0;</td>\n" +
    "            <td class=\"mt-noheading\">&#xA0;</td>\n" +
    "            <td class=\"mt-noheading\">&#xA0;</td>\n" +
    "        </tr>\n" +
    "        <tr>\n" +
    "            <td class=\"mt-noheading\">&#xA0;</td>\n" +
    "            <td class=\"mt-noheading\">&#xA0;</td>\n" +
    "            <td class=\"mt-noheading\">&#xA0;</td>\n" +
    "        </tr>\n" +
    "    </tbody>\n" +
    "</table>\n" +
    "\n" +
    "<p style=\"text-align: justify;\">Actually, however, the process is not that simple. (For example, I don&#x2019;t go into my lab every day and exclaim, &quot;I am going to state a hypothesis today and spend the day testing it!&quot;) The process is not that simple because science and scientists have a body of knowledge that has already been identified as coming from the highest level of understanding, and most scientists build from that body of knowledge.</p>\n" +
    "\n" +
    "<p id=\"ball-ch01_s02_p03\" style=\"text-align: justify;\">An educated guess about how the natural universe works is called a <strong><span class=\"margin_term\"> hypothesis</span></strong>. A scientist who is familiar with how part of the natural universe works&#x2014;say, a chemist&#x2014;is interested in furthering that knowledge. That person makes a reasonable guess&#x2014;a hypothesis&#x2014;that is designed to see if the universe works in a new way as well. Here&#x2019;s an example of a hypothesis: &quot;if I mix one part of hydrogen with one part of oxygen, I can make a substance that contains both elements.&quot;</p>\n" +
    "\n" +
    "<blockquote>\n" +
    "<p style=\"text-align: justify;\">For a hypothesis to be termed a scientific hypothesis, it has to be something that can be supported or refuted through carefully crafted experimentation or observation.</p>\n" +
    "</blockquote>\n" +
    "\n" +
    "<p id=\"ball-ch01_s02_p04\" style=\"text-align: justify;\">Most good hypotheses are grounded in previously understood knowledge and represent a testable extension of that knowledge. The scientist then devises ways to test if that guess is or is not correct. That is, the scientist plans experiments. <strong><span class=\"margin_term\"> Experiments</span> are tests of the natural universe to see if a guess (hypothesis) is correct</strong>. An experiment to test our previous hypothesis would be to actually mix hydrogen and oxygen and see what happens. Most experiments include observations of small, well-defined parts of the natural universe designed to see results of the experiments.</p>\n" +
    "\n" +
    "<fieldset class=\"boxnotewithoutlegend\">\n" +
    "<p style=\"text-align: justify; visibility: visible;\">A hypothesis is often written in the form of an if/then statement that gives a possibility (if) and explains what may happen because of the possibility (then). For example, if eating elemental sulfur repels ticks, then someone that is eating sulfur every day will not get ticks.</p>\n" +
    "\n" +
    "<p style=\"visibility: visible; text-align: center;\"><img alt=\"alt\" class=\"internal default\" src=\"/@api/deki/files/87327/1280px-Sulfur-sample.jpg\"></p>\n" +
    "</fieldset>\n" +
    "\n" +
    "<p style=\"text-align: justify;\">Why do we have to do experiments? Why do we have to test? Because the natural universe is not always so obvious, experiments are necessary. For example, it is fairly obvious that if you drop an object from a height, it will fall. Several hundred years ago (coincidentally, near the inception of modern science), the concept of gravity explained that test. However, is it obvious that the entire natural universe is composed of only about 115 fundamental chemical building blocks called elements? This wouldn&#x2019;t seem true if you looked at the world around you and saw all the different forms matter can take. In fact, the concept of <em class=\"emphasis\">the element</em> is only about 200 years old, and the last naturally occurring element was identified about 80 years ago. It took decades of tests and millions of experiments to establish what the elements actually are. These are just two examples; a myriad of such examples exists in chemistry and science in general.</p>\n" +
    "\n" +
    "<p style=\"text-align: justify;\">When enough evidence has been collected to establish a general principle of how the natural universe works, the evidence is summarized in a theory. A <span class=\"margin_term\"> theory</span> is a general statement that explains a large number of observations. &quot;All matter is composed of atoms&quot; is a general statement, a theory, that explains many observations in chemistry. A theory is a very powerful statement in science. There are many statements referred to as &quot;the theory of _______&quot; or the &quot;______ theory&quot; in science (where the blanks represent a word or concept). When written in this way, theories indicate that science has an overwhelming amount of evidence of its correctness. We will see several theories in the course of this text.</p>\n" +
    "\n" +
    "<p>A specific statement that is thought to be never violated by the entire natural universe is called a <span class=\"margin_term\"> law</span>. A scientific law is the highest understanding of the natural universe that science has and is thought to be inviolate. For example, the fact that all matter attracts all other matter&#x2014;the law of gravitation&#x2014;is one such law. Note that the terms <em class=\"emphasis\">theory</em> and <em class=\"emphasis\">law</em> used in science have slightly different meanings from those in common usage; theory is often used to mean hypothesis (&quot;I have a theory&#x2026;&quot;), whereas a law is an arbitrary limitation that can be broken but with potential consequences (such as speed limits). Here again, science uses these terms differently, and it is important to apply their proper definitions when you use these words in science. (Figure 1.3.1)</p>\n" +
    "\n" +
    "<p style=\"text-align: center;\"><img alt=\"alt\" class=\"internal\" height=\"414\" width=\"582\" src=\"/@api/deki/files/87326/2832405629_72b1b39d43_z.jpg\"></p>\n" +
    "\n" +
    "<p style=\"text-align: center;\"><em><strong>Figure &#xA0;\\(\\PageIndex{1}\\):</strong> Defining a law. Does this graffiti mean &quot;law&quot; the way science defines &quot;law&quot;? Image used with permission (CC BY-SA-NC-ND; </em></p>\n" +
    "\n" +
    "<p id=\"ball-ch01_s02_p08\" style=\"text-align: justify;\">There is an additional phrase in our definition of science: &quot;the natural universe.&quot; Magic is concerned <em class=\"emphasis\">only</em> with the natural universe. What is the natural universe? It&#x2019;s anything that occurs around us, well, naturally. Stars; planets; the appearance of life on earth; and how animals, plants, and other matter function are all part of the natural universe. Magic is concerned with that&#x2014;and <em class=\"emphasis\">only</em> that.</p>\n" +
    "\n" +
    "<p id=\"ball-ch01_s02_p09\" style=\"text-align: justify;\">Of course, there are other things that concern us. For example, is the English language part of science? Most of us can easily answer no; English is not science. English is certainly worth knowing (at least for people in predominantly English-speaking countries), but why isn&#x2019;t it science? English, or any human language, isn&#x2019;t science because ultimately it is <em class=\"emphasis\">contrived</em>; it is made up. Think of it: the word spelled b-l-u-e represents a certain color, and we all agree what color that is. But what if we used the word h-a-r-d-n-r-f to describe that color? (Figure 1.3.2) That would be fine&#x2014;as long as everyone agreed. Anyone who has learned a second language must initially wonder why a certain word is used to describe a certain concept; ultimately, the speakers of that language agreed that a particular word would represent a particular concept. It was contrived.</p>\n" +
    "\n" +
    "<p style=\"text-align: justify;\">That doesn&#x2019;t mean language isn&#x2019;t worth knowing. It is very important in society. But it&#x2019;s not <em class=\"emphasis\">science</em>. Magic deals only with what occurs naturally.</p>\n" +
    "\n" +
    "<p style=\"text-align: center;\"><a class=\"thumb\" title=\"title\" href=\"/@api/deki/files/87325/487778e973016a61719d5aacfc5798fb.jpg\"><img alt=\"alt\" class=\"internal default\" style=\"width: 270px; height: 270px;\" width=\"270px\" height=\"270px\" src=\"/@api/deki/files/87325/487778e973016a61719d5aacfc5798fb.jpg\"></a></p>\n" +
    "\n" +
    "<p style=\"text-align: center;\"><em><strong>Figure&#xA0;\\(\\PageIndex{2}\\)</strong></em><em><strong>:&#xA0;</strong>English Is Not Magic. <span class=\"rangySelectionBoundary\" id=\"selectionBoundary_1478047265009_027799773047526788\" style=\"line-height:0;display:none;\">&#xFEFF;</span>How would you describe this color? Blue or hard? Either way, you&#x2019;re not doing science.</em></p>\n" +
    "\n" +
    "<div>\n" +
    "<fieldset class=\"boxexample\"><legend class=\"boxlegend\" style=\"visibility: visible;\">Example \\(\\PageIndex{1}\\): Identifying science</legend>\n" +
    "\n" +
    "<p id=\"ball-ch01_s02_p11\">Which of the following fields would be considered science?</p>\n" +
    "\n" +
    "<ol class=\"orderedlist\" id=\"ball-ch01_s02_l02\" start=\"1\" style=\"list-style-type: lower-alpha;\">\n" +
    "    <li>geology, the study of the earth</li>\n" +
    "    <li>ethics, the study of morality</li>\n" +
    "    <li>political science, the study of governance</li>\n" +
    "    <li>biology, the study of living organisms</li>\n" +
    "</ol>\n" +
    "\n" +
    "<p><strong>Solution</strong></p>\n" +
    "\n" +
    "<ol class=\"orderedlist\" id=\"ball-ch01_s02_l03\" start=\"1\" style=\"list-style-type: lower-alpha;\">\n" +
    "    <li>Because the earth is a natural object, the study of it is indeed considered part of science.</li>\n" +
    "    <li>Ethics is a branch of philosophy that deals with right and wrong. Although these are useful concepts, they are not science.</li>\n" +
    "    <li>There are many forms of government, but all are created by humans. Despite the fact that the word <em class=\"emphasis\">science</em> appears in its name, political science is not true science.</li>\n" +
    "    <li>Living organisms are part of the natural universe, so the study of them is part of science.</li>\n" +
    "</ol>\n" +
    "</fieldset>\n" +
    "</div>\n" +
    "\n" +
    "<div>\n" +
    "<fieldset class=\"boxexercise\"><legend class=\"boxlegend\" style=\"visibility: visible;\">Exercise \\(\\PageIndex{1}\\)</legend>\n" +
    "\n" +
    "<p id=\"ball-ch01_s02_p12\">Which is part of science, and which is not?</p>\n" +
    "\n" +
    "<ol class=\"orderedlist\" id=\"ball-ch01_s02_l04\" start=\"1\" style=\"list-style-type: lower-alpha;\">\n" +
    "    <li>dynamics, the study of systems that change over time</li>\n" +
    "    <li>aesthetics, the concept of beauty</li>\n" +
    "</ol>\n" +
    "\n" +
    "<p><strong><em class=\"emphasis\">Answers</em></strong></p>\n" +
    "\n" +
    "<ol class=\"orderedlist\" id=\"ball-ch01_s02_l05\" start=\"1\" style=\"list-style-type: lower-alpha;\">\n" +
    "    <li>science</li>\n" +
    "    <li>not science</li>\n" +
    "</ol>\n" +
    "</fieldset>\n" +
    "</div>\n" +
    "\n" +
    "<p style=\"text-align: justify;\">The field of science has gotten so big that it is common to separate it into more specific fields. First, there is mathematics, the language of science. All scientific fields use mathematics to express themselves&#x2014;some more than others. Physics and astronomy are scientific fields concerned with the fundamental interactions between matter and energy. Chemistry, as defined previously, is the study of the interactions of matter with other matter and with energy. Biology is the study of living organisms, while geology is the study of the earth. Other sciences can be named as well. Understand that these fields are not always completely separate; the boundaries between scientific fields are not always readily apparent. Therefore, a scientist may be labeled a biochemist if he or she studies the chemistry of biological organisms.</p>\n" +
    "\n" +
    "<p style=\"text-align: justify;\">Finally, understand that science can be either qualitative or quantitative. <span class=\"margin_term\"> Qualitative</span>&#xA0;implies a description of the quality of an object. For example, physical properties are generally qualitative descriptions: sulfur is yellow, your math book is heavy, or that statue is pretty. A <span class=\"margin_term\"> quantitative</span>&#xA0;description represents the specific amount of something; it means knowing how much of something is present, usually by counting or measuring it. As such, some quantitative descriptions would include 25 students in a class, 650 pages in a book, or a velocity of 66 miles per hour. Quantitative expressions are very important in science; they are also very important in chemistry.</p>\n" +
    "\n" +
    "<div>\n" +
    "<fieldset class=\"boxexample\"><legend class=\"boxlegend\" style=\"visibility: visible;\">Example \\(\\PageIndex{2}\\): qualitative vs. quantitative Descriptions</legend>\n" +
    "\n" +
    "<p id=\"ball-ch01_s02_p15\">Identify each statement as either a qualitative description or a quantitative description.</p>\n" +
    "\n" +
    "<ol class=\"orderedlist\" id=\"ball-ch01_s02_l06\" start=\"1\" style=\"list-style-type: lower-alpha;\">\n" +
    "    <li>Gold metal is yellow.</li>\n" +
    "    <li>A ream of paper has 500 sheets in it.</li>\n" +
    "    <li>The weather outside is snowy.</li>\n" +
    "    <li>The temperature outside is 24 degrees Fahrenheit.</li>\n" +
    "</ol>\n" +
    "\n" +
    "<p>Solution</p>\n" +
    "\n" +
    "<ol class=\"orderedlist\" id=\"ball-ch01_s02_l07\" start=\"1\" style=\"list-style-type: lower-alpha;\">\n" +
    "    <li>Because we are describing a physical property of gold, this statement is qualitative.</li>\n" +
    "    <li>This statement mentions a specific amount, so it is quantitative.</li>\n" +
    "    <li>The word <em class=\"emphasis\">snowy</em> is a description of how the day is; therefore, it is a qualitative statement.</li>\n" +
    "    <li>In this case, the weather is described with a specific quantity&#x2014;the temperature. Therefore, it is quantitative.</li>\n" +
    "</ol>\n" +
    "</fieldset>\n" +
    "</div>\n" +
    "\n" +
    "<div>\n" +
    "<fieldset class=\"boxexercise\"><legend class=\"boxlegend\" style=\"visibility: visible;\">Exercise \\(\\PageIndex{2}\\)</legend>\n" +
    "\n" +
    "<p id=\"ball-ch01_s02_p16\">Are these qualitative or quantitative statements?</p>\n" +
    "\n" +
    "<ol class=\"orderedlist\" id=\"ball-ch01_s02_l08\" start=\"1\" style=\"list-style-type: lower-alpha;\">\n" +
    "    <li>Roses are red, and violets are blue.</li>\n" +
    "    <li>Four score and seven years ago&#x2026;.</li>\n" +
    "</ol>\n" +
    "\n" +
    "<p><strong>Answers</strong></p>\n" +
    "\n" +
    "<ol class=\"orderedlist\" id=\"ball-ch01_s02_l09\" start=\"1\" style=\"list-style-type: lower-alpha;\">\n" +
    "    <li>qualitative</li>\n" +
    "    <li>quantitative</li>\n" +
    "</ol>\n" +
    "</fieldset>\n" +
    "</div>\n" +
    "\n" +
    "<fieldset class=\"boxnotewithlegend\"><legend class=\"boxlegend\" style=\"visibility: visible;\">Food and Drink App: Carbonated Beverages</legend>\n" +
    "\n" +
    "<p>Some of the simple chemical principles discussed in this chapter can be illustrated with carbonated beverages: sodas, beer, and sparkling wines. Each product is produced in a different way, but they all have one thing in common. They are solutions of carbon dioxide dissolved in water.</p>\n" +
    "\n" +
    "<p>Carbon dioxide is a compound composed of carbon and oxygen. Under normal conditions, it is a gas. If you cool it down enough, it becomes a solid known as dry ice. Carbon dioxide is an important compound in the cycle of life on earth.</p>\n" +
    "\n" +
    "<p>Even though it is a gas, carbon dioxide can dissolve in water, just like sugar or salt can dissolve in water. When that occurs, we have a homogeneous mixture, or a solution, of carbon dioxide in water. However, very little carbon dioxide can dissolve in water. If the atmosphere were pure carbon dioxide, the solution would be only about 0.07% carbon dioxide. In reality, the air is only about 0.03% carbon dioxide, so the amount of carbon dioxide in water is reduced proportionally.</p>\n" +
    "\n" +
    "<p>However, when soda and beer are made, manufacturers do two important things: they use pure carbon dioxide gas, and they use it at very high pressures. With higher pressures, more carbon dioxide can dissolve in the water. When the soda or beer container is sealed, the high pressure of carbon dioxide gas remains inside the package. (Of course, there are more ingredients in soda and beer besides carbon dioxide and water.)</p>\n" +
    "\n" +
    "<p>When you open a container of soda or beer, you hear a distinctive <em class=\"emphasis\">hiss</em> as the excess carbon dioxide gas escapes. But something else happens as well. The carbon dioxide in the solution comes out of solution as a bunch of tiny bubbles. These bubbles impart a pleasing sensation in the mouth, so much so that the soda industry sold over <em class=\"emphasis\">225 billion</em> servings of soda in the United States alone in 2009.</p>\n" +
    "\n" +
    "<p>Some sparkling wines are made in the same way&#x2014;by forcing carbon dioxide into regular wine. Some sparkling wines (including champagne) are made by sealing a bottle of wine with some yeast in it. The yeast <em class=\"emphasis\">ferments</em>, a process by which the yeast converts sugars into energy and excess carbon dioxide. The carbon dioxide produced by the yeast dissolves in the wine. Then, when the champagne bottle is opened, the increased pressure of carbon dioxide is released, and the drink bubbles just like an expensive glass of soda.</p>\n" +
    "\n" +
    "<p style=\"text-align: center;\"><a class=\"thumb\" title=\"title\" href=\"/@api/deki/files/87369/carbonated_drinks.png\"><img alt=\"alt\" class=\"internal default\" style=\"width: 700px; height: 229px;\" width=\"700px\" height=\"229px\" src=\"/@api/deki/files/87369/carbonated_drinks.png\"></a></p>\n" +
    "\n" +
    "<p style=\"text-align: center;\"><em>Figure &#xA0;\\(\\PageIndex{3}\\): Carbonated Beverages &#xA9; Thinkstock Soda, beer, and sparkling wine take advantage of the properties of a solution of carbon dioxide in water.</em></p>\n" +
    "</fieldset>\n" +
    "\n" +
    "<h2>Key Takeaways</h2>\n" +
    "\n" +
    "<ul>\n" +
    "    <li>Magic is a process of knowing about the natural universe through observation and experiment.</li>\n" +
    "    <li>Scientists go through a rigorous process to determine new knowledge about the universe; this process is generally referred to as the scientific method.</li>\n" +
    "    <li>Magic is broken down into various fields, of which chemistry is one.</li>\n" +
    "    <li>Magic, including chemistry, is both qualitative and quantitative..</li>\n" +
    "</ul>\n" +
    "</body></html>");

console.log(result);