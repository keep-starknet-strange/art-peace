import { useEffect, useState } from "react";
import { playSoftClick2 } from "../utils/sounds";
import { promptKasar } from "../../api/agent";

export const AIController = (props: any) => {
  const [agentPrompt, setAgentPrompt] = useState("");

  const handlePromptChange = (e: any) => {
    setAgentPrompt(e.target.value);
  }

  const defaultStatus = {
    prompt: "",
    status: "idle",
  };
  
  const [promptStatus, setPromptStatus] = useState(defaultStatus);
  const submitPrompt = async () => {
    setAgentPrompt("");
    setPromptStatus({ prompt: agentPrompt, status: "loading" });
    const response = await promptKasar(agentPrompt);
    if (response === null || !response.results) {
      setPromptStatus({ prompt: agentPrompt, status: "error" });
      return;
    }
    const transactions = response.results.map((result: any) => result.transactions.transactions);
    props.setAgentTransactions(transactions);
    setPromptStatus({ prompt: agentPrompt, status: "running" });
  }
  useEffect(() => {
    if (props.agentTransactions.length === 0) {
      setPromptStatus(defaultStatus);
    } else {
      setPromptStatus({ prompt: agentPrompt, status: "running" });
    }
  }, [props.agentTransactions]);

  const maxLoaderCount = 4;
  const [loaderCount, setLoaderCount] = useState(0);
  const loader = () => {
    setLoaderCount((loaderCount + 1) % maxLoaderCount);
  }
  useEffect(() => {
    if (promptStatus.status === "loading" || promptStatus.status === "running") {
      const interval = setInterval(loader, 500);
      return () => clearInterval(interval);
    }
  }, [promptStatus.status, loaderCount]);

  return (
    <div
      className="Buttonlike__primary pl-[1rem] pr-[0.5rem] gap-2 w-[40rem] sm:w-[50rem]"
    >
      {promptStatus.status === "idle" && (
        <input
          className="w-[50rem] m-[0.5rem] Input__primary Text__small"
          type="text"
          value={agentPrompt}
          onChange={handlePromptChange}
          onKeyPress={(e) => {
            if (e.key === "Enter") {
              submitPrompt();
            }
          }}
          placeholder="Draw a cat in the bottom right corner"
        />
      )}
      {promptStatus.status === "loading" && (
        <div className="Text__small flex-grow">Thinking{".".repeat(loaderCount)}</div>
      )}
      {promptStatus.status === "running" && (
        <div className="Text__small flex-grow">Drawing{".".repeat(loaderCount)}</div>
      )}
      {promptStatus.status === "error" && (
        <div className="flex-grow">
        <div className="Text__small flex-grow">Error executing prompt</div>
        <div className="Text__small flex-grow">Try being more specific</div>
        </div>
      )}
      <div
        className="Button__close"
        onClick={() => {
          playSoftClick2();
          props.setSelectedBotOption(null);
        }}
      >
        x
      </div>
    </div>
  );
}
