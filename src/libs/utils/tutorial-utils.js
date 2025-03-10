import { isSmallScreen, messages, conversations, selectedConversation, contextMenuOpened, selectedModel, systemPrompt } from "../state-management/state";
import { deleteCurrentConversation } from "../conversation-management/useConversations";
import { driver } from "driver.js";
import { nextTick, computed } from "vue";
import { saveSystemPrompt, systemPrompts } from "./settings-utils";
import i18n from "../../i18n";

const { t } = i18n.global;

export async function runTutorialForSettings() {
    const hasShownUserSettingsTutorial = JSON.parse(localStorage.getItem('hasShownUserSettingsTutorial') || false);

    if (hasShownUserSettingsTutorial) {
        return;
    }

    systemPrompt.value = t('tutorial.daleGribblePrompt');
    saveSystemPrompt(t('tutorial.daleGribblePrompt'));
    selectedModel.value = 'general-config'; // use the general section for walkthrough

    const settingsTutorialSteps = [
        {
            popover: {
                title: t('tutorial.settings.title'),
                description: t('tutorial.settings.welcome')
            }
        },
        {
            element: '.right-panel',
            popover: {
                title: t('tutorial.settings.gestureTitle'),
                description: t('tutorial.settings.gestureDesc'),
                side: "top",
                align: 'center'
            }
        },
        {
            element: '.left-panel',
            popover: {
                title: t('tutorial.settings.modelPanelTitle'),
                description: t('tutorial.settings.modelPanelDesc'),
                side: "right",
                align: 'start'
            }
        },
        {
            element: '.left-panel ul li:nth-child(2)',
            popover: {
                title: t('tutorial.settings.modelGroupsTitle'),
                description: t('tutorial.settings.modelGroupsDesc'),
                side: "right",
                align: 'start'
            }
        },
        {
            element: '.left-panel ul li:nth-child(1)',
            popover: {
                title: t('tutorial.settings.generalConfigTitle'),
                description: t('tutorial.settings.generalConfigDesc'),
                side: "right",
                align: 'start'
            }
        },
        {
            element: '.right-panel',
            popover: {
                title: t('tutorial.settings.configSectionTitle'),
                description: t('tutorial.settings.configSectionDesc'),
                side: "left",
                align: 'start'
            }
        },
        {
            element: '.system-prompt-container',
            popover: {
                title: t('tutorial.settings.systemPromptTitle'),
                description: t('tutorial.settings.systemPromptDesc'),
                side: "left",
                align: 'start'
            }
        },
        {
            element: '.saved-system-prompts',
            popover: {
                title: t('tutorial.settings.savedPromptsTitle'),
                description: t('tutorial.settings.savedPromptsDesc'),
                side: "left",
                align: 'start'
            }
        },
        {
            element: '.control-checkbox',
            popover: {
                title: t('tutorial.settings.contrastTitle'),
                description: t('tutorial.settings.contrastDesc'),
                side: "left",
                align: 'start'
            }
        },
        {
            element: '.config-section',
            popover: {
                title: t('tutorial.settings.importExportTitle'),
                description: t('tutorial.settings.importExportDesc'),
                side: "left",
                align: 'start'
            }
        },
        {
            popover: {
                title: t('tutorial.settings.finishedTitle'),
                description: t('tutorial.settings.finishedDesc')
            }
        }
    ];

    nextTick(async () => {
        if (!hasShownUserSettingsTutorial) {
            nextTick(async () => {
                const driverObj = driver({
                    popoverClass: 'driverjs-theme',
                    allowClose: true,
                    stageRadius: 18,
                    showProgress: true,
                    overlayOpacity: 0.75,
                    steps: settingsTutorialSteps,
                    onDestroyStarted: () => {
                        driverObj.destroy();

                        systemPrompt.value = "";
                        systemPrompts.value = "";
                        localStorage.setItem('system-prompts', "");
                    },
                });
                driverObj.drive();
                localStorage.setItem('hasShownUserSettingsTutorial', true);
            });
        }
    });
}

export async function runTutortialForNewUser() {
    const hasShownUserTutorial = JSON.parse(localStorage.getItem('hasShownUserTutorial') || false);

    const mobileTutorialSteps = [
        { popover: { title: t('tutorial.main.title'), description: t('tutorial.main.welcome') } },
        { element: '.settings-btn', popover: { title: t('tutorial.main.configTitle'), description: t('tutorial.main.configDesc') } },
        { element: '#settings-dialog', popover: { title: t('tutorial.main.swipeRightTitle'), description: t('tutorial.main.swipeRightDesc'), side: "top", align: 'start' } },
        { element: '#conversations-dialog', popover: { title: t('tutorial.main.swipeLeftTitle'), description: t('tutorial.main.swipeLeftDesc'), side: "top", align: 'start' } },
        { element: '#message-0', popover: { title: t('tutorial.main.editMsgTitle'), description: t('tutorial.main.editMsgDesc') } },
        { element: '.gpt .label', popover: { title: t('tutorial.main.copyMsgTitle'), description: t('tutorial.main.copyMsgDesc') } },
        { element: '.context-menu', popover: { title: t('tutorial.main.quickActionsTitle'), description: t('tutorial.main.quickActionsDesc'), side: "top", align: 'start' } },
        { element: '.image-button', popover: { title: t('tutorial.main.visionTitle'), description: t('tutorial.main.visionDesc') } },
        { element: '.upload-button', popover: { title: t('tutorial.main.uploadTitle'), description: t('tutorial.main.uploadDesc') } },
        { element: '.header-icon', popover: { title: t('tutorial.main.githubTitle'), description: t('tutorial.main.githubDesc') } },
        { popover: { title: t('tutorial.main.completeTitle'), description: t('tutorial.main.completeDesc') } }
    ];

    const desktopTutorialSteps = [
        { popover: { title: t('tutorial.desktop.title'), description: t('tutorial.desktop.welcome') } },
        { element: '#quick-select-model-selector', popover: { title: t('tutorial.desktop.modelSelectorTitle'), description: t('tutorial.desktop.modelSelectorDesc') } },
        { element: '.sidebar-conversations', popover: { title: t('tutorial.desktop.conversationsTitle'), description: t('tutorial.desktop.conversationsDesc'), side: "top", align: 'start' } },
        { element: '#conversation-0', popover: { title: t('tutorial.desktop.editTitleTitle'), description: t('tutorial.desktop.editTitleDesc'), side: "top", align: 'start' } },
        { element: '.settings-icon', popover: { title: t('tutorial.desktop.configTitle'), description: t('tutorial.desktop.configDesc') } },
        { element: '#message-0', popover: { title: t('tutorial.desktop.editMsgTitle'), description: t('tutorial.desktop.editMsgDesc') } },
        { element: '.gpt .label', popover: { title: t('tutorial.desktop.copyMsgTitle'), description: t('tutorial.desktop.copyMsgDesc') } },
        { element: '.image-button', popover: { title: t('tutorial.desktop.visionTitle'), description: t('tutorial.desktop.visionDesc') } },
        { element: '.upload-button', popover: { title: t('tutorial.desktop.uploadTitle'), description: t('tutorial.desktop.uploadDesc') } },
        { element: '.header-icon', popover: { title: t('tutorial.desktop.githubTitle'), description: t('tutorial.desktop.githubDesc') } },
        { popover: { title: t('tutorial.desktop.completeTitle'), description: t('tutorial.desktop.completeDesc') } }
    ];

    // Add a temporary placeholder conversation item
    const placeholderConversation = {
        id: '0',
        title: t('tutorial.exampleTitle'),
        messageHistory: [
            { id: 0, role: 'user', content: t('tutorial.exampleUser') },
            { id: 1, role: 'assistant', content: t('tutorial.exampleAssistant') }
        ]
    };

    nextTick(async () => {
        if (!hasShownUserTutorial) {
            const event = new Event('show-context-menu');
            window.dispatchEvent(event);

            await nextTick(() => {
                const driverObj = driver({
                    popoverClass: 'driverjs-theme',
                    allowClose: true,
                    stageRadius: 18,
                    showProgress: true,
                    overlayOpacity: 0.75,
                    steps: isSmallScreen.value === true ? mobileTutorialSteps : desktopTutorialSteps,
                    onDestroyStarted: () => {
                        driverObj.destroy();

                        deleteCurrentConversation();

                        contextMenuOpened.value = false;
                    },

                });

                messages.value = placeholderConversation.messageHistory;
                conversations.value.push(placeholderConversation);
                selectedConversation.value = placeholderConversation;

                driverObj.drive();

                localStorage.setItem('hasShownUserTutorial', true);
            });
        }
    });
}