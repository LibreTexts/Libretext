import React from "react";
import Button from "@material-ui/core/Button";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ListItemText from "@material-ui/core/ListItemText";
import { IconLink, LibraryItem, TableOfContents } from "./Common.jsx";
import Accordion from "@material-ui/core/Accordion";
import AccordionSummary from "@material-ui/core/AccordionSummary";
import AccordionDetails from "@material-ui/core/AccordionDetails";
import Typography from "@material-ui/core/Typography";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import { saveAs } from "file-saver";

export default function Developers(props) {
  let tags = document.getElementById("pageTagsHolder")?.innerText || "";
  const allowMatter =
    tags.includes("coverpage:yes") ||
    tags.includes("coverpage:toc") ||
    tags.includes("coverpage:nocommons");

  const CONSTRUCTION_GUIDE_URL =
    "https://chem.libretexts.org/Courses/Remixer_University/Construction_Guide_for_LibreTexts_2e";

  return (
    <List>
      <Accordion className="SidebarItem">
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="panel1a-content"
        >
          <ListItemLink href={CONSTRUCTION_GUIDE_URL} target="_blank">
            <ListItemIcon className="mt-icon-site-tools"></ListItemIcon>
            <ListItemText primary="Construction Guide" />
          </ListItemLink>
        </AccordionSummary>
        <AccordionDetails>
          <TableOfContents coverpageURL={CONSTRUCTION_GUIDE_URL} />
        </AccordionDetails>
      </Accordion>
      <IconLink
        title="Reveal Answers"
        icon="mt-icon-eye3"
        onClick={() => {
          $("dd").show();
        }}
      />
      <IconLink
        title="Reset Page Order"
        icon="mt-icon-shuffle"
        onClick={() => {
          LibreTexts.authenticatedFetch(null, "unorder", null, {
            method: "PUT",
          });
          window.location.reload();
        }}
      />
      <IconLink
        title="Get PageIDs"
        icon="mt-icon-flow-cascade"
        onClick={() => {
          LibreTexts.getSubpages().then((data) => {
            data = JSON.stringify(data).match(/"id":"\d+"/g);
            if (data) {
              data = data.map((e) => e.match(/"id":"(\d+)"/)[1]);
            } else {
              data = [document.getElementById("IDHolder")?.innerText];
            }
            let [subdomain] = LibreTexts.parseURL();
            data = data.map((e) => subdomain + "-" + e);
            navigator.clipboard.writeText(data.join(", "));
            console.log(data.join(", "));
            alert("Copied pageIDs to the clipboard");
          });
        }}
      />
      {allowMatter ? (
        <IconLink
          title="Generate Front/Back Matter"
          icon="mt-icon-book2"
          onClick={() => {
            try {
              LibreTexts.batch(window.location.href, "&createMatterOnly=true");
            } catch (e) {
              console.error("MATTER GENERATION ERROR:", e);
            }
          }}
        />
      ) : null}
      <IconLink
        title="RealTime Mathjax"
        icon="fas fa-square-root-alt"
        href="https://chem.libretexts.org/Under_Construction/Development_Details/Misc_Pages/Realtime_MathJax"
      />
    </List>
  );
}

function ListItemLink(props) {
  return <ListItem button component="a" {...props} />;
}
