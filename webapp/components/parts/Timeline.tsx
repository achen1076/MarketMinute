import React, { useEffect, useState } from "react";
import { cn } from "../../constants/globalFunctions.tsx";
import Label from "../atoms/label.tsx";
import ProjectCards from "../organisms/ProjectCards.tsx";
import { useScrollAnimation } from "../../hooks/useScrollAnimation.tsx";
import { useWindowSize } from "../../hooks/useWindowSize.tsx";

interface TimelineProps {
  className?: string;
}

const Timeline: React.FC<TimelineProps> = ({ className }) => {
  const globalStyle = "w-full text-center space-y-8";

  const projectOneAnimation = useScrollAnimation();
  const projectTwoAnimation = useScrollAnimation();
  const projectThreeAnimation = useScrollAnimation();
  const projectFourAnimation = useScrollAnimation();
  const projectFiveAnimation = useScrollAnimation();

  const { width } = useWindowSize();
  const [aboveWidthThreshold, setAboveWidthThreshold] = useState(true);

  useEffect(() => {
    setAboveWidthThreshold(width > 1024);
    const handleResize = () => setAboveWidthThreshold(width > 1024);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [width]);

  const projectInfo = [
    {
      name: "AndrewNathanChen (old)",
      description:
        `I created my personal portfolio site from scratch using React, HTML, CSS, and TypeScript. It includes interactive animations, custom transitions, 
        and dynamic components driven by React hooks and state. The site showcases my technical work, background, and ways to get in touch. It’s a reflection of my early stages of front-end development 
        skills and design creativity.`,
      link: "https://github.com/achen1076/portfolio",
      linkType: "github",
      imageLink: "media/test.png"
    },
    {
      name: "Bajamas",
      description:
        `Bajamas was my first full-stack web app, built with React, HTML, CSS, and JavaScript on the frontend, Firebase and Django on the backend. I implemented authentication and different role-based views, so every registered user had a unique interface. This project helped me understand the interaction between client-side rendering and backend logic. I also learned how to manage data securely and build scalable front-end components. It was a major step forward in my journey as a web developer.`,
      link: "https://github.com/achen1076/da",
      linkType: "github",
    },
    {
      name: "AI Email Sentiment Analysis – Ally Financial",
      description:
        `I worked with a team on the development of an AI-based sentiment analysis system for Ally Bank that monitored over 100 email threads daily. I created an Outlook widget and a dashboard using Flask, React, PostgreSQL, LangChain, and OpenAI API. The system achieved over 95% accuracy and could handle more than 500 threads simultaneously. My solution cut email review time by 30% and helped 2,500+ users gain insights faster. This project combined my backend engineering skills with my interest in NLP and real-time analytics.`,
      link: "https://gitlab.msu.edu/cse-498-team-ally/website",
      linkType: "gitlab",
    },
    {
      name: "Angry Birds C++ Application",
      description:
        `This was a fully playable recreation of Angry Birds developed in C++ as part of a team project. I led a group of five students using the Agile development model, organizing sprint meetings and coordinating our efforts across different modules. The game featured real-time physics, collision detection, object management, and a scoring system, all built with over 25 custom C++ classes and multiple third-party libraries. We emphasized modularity and scalability so the game could be easily expanded with new levels or features.`,
      link: "https://gitlab.msu.edu/common-grackle/project1/-/tree/master",
      linkType: "gitlab",
    },
    {
      name: "Keyframe Movie Maker",
      description:
       `This was an earlier project where I built a lightweight movie maker tool using C++ and graphical libraries. The application allowed users to load image frames, sequence them on a timeline, and export a basic animated movie. I focused on managing memory effectively while handling large image files and ensuring smooth playback. This project helped me gain confidence with file I/O operations, basic multimedia processing, and performance optimization in C++. It laid the groundwork for my later work on more complex animation systems like the Keyframe Movie Maker`,
      link: "",
      linkType: "gitlab",
    },
  ];

  return (
    <div className={cn(globalStyle, className, "relative z-10")}>
      <div className="relative inline-block">
        <Label size="4xl" bold={true} className="text-white">
          Projects
        </Label>
        <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full"></div>
      </div>
      <div className="space-y-8">
        <ProjectCards
          variant={aboveWidthThreshold ? "left" : "center"}
          color="bg-red-500"
          ref={projectOneAnimation.ref}
          className={`${
            projectOneAnimation.isVisible ? "animate-fadeRight" : "opacity-0"
          }`}
          ProjectName={projectInfo[0].name}
          ProjectDescription={projectInfo[0].description}
          ProjectLink={projectInfo[0].link}
          ImageLink={projectInfo[0].imageLink}
          LinkType={projectInfo[0].linkType}
        />
        <ProjectCards
          variant={aboveWidthThreshold ? "right" : "center"}
          color="bg-blue-500"
          ref={projectTwoAnimation.ref}
          className={`${
            projectTwoAnimation.isVisible ? "animate-fadeLeft" : "opacity-0"
          }`}
          ProjectName={projectInfo[1].name}
          ProjectDescription={projectInfo[1].description}
          ProjectLink={projectInfo[1].link}
          LinkType={projectInfo[1].linkType}
          ImageLink={projectInfo[1].imageLink}
        />
        <ProjectCards
          variant={aboveWidthThreshold ? "left" : "center"}
          color="bg-green-500"
          ref={projectThreeAnimation.ref}
          className={`${
            projectThreeAnimation.isVisible ? "animate-fadeRight" : "opacity-0"
          }`}
          ProjectName={projectInfo[2].name}
          ProjectDescription={projectInfo[2].description}
          ProjectLink={projectInfo[2].link}
          LinkType={projectInfo[2].linkType}
        />
        <ProjectCards
          variant={aboveWidthThreshold ? "right" : "center"}
          color="bg-yellow-500"
          ref={projectFourAnimation.ref}
          className={`${
            projectFourAnimation.isVisible ? "animate-fadeLeft" : "opacity-0"
          }`}
          ProjectName={projectInfo[3].name}
          ProjectDescription={projectInfo[3].description}
          ProjectLink={projectInfo[3].link}
          LinkType={projectInfo[3].linkType}
        />
        <ProjectCards
          variant= {aboveWidthThreshold ? "left" : "center"}
          color="bg-purple-500"
          ref={projectFiveAnimation.ref}
          className={`${
            projectFiveAnimation.isVisible ? "animate-fadeRight" : "opacity-0"
          }`}
          ProjectName={projectInfo[4].name}
          ProjectDescription={projectInfo[4].description}
          ProjectLink={projectInfo[4].link}
          LinkType={projectInfo[4].linkType}
        />
      </div>
      
    </div>
  );
};

export default Timeline;
