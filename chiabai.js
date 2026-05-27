// chiabai.js

function chiaBaiTheoVong(
    boBaiGoc,
    hands,
    renderAllHands,
    callbackKetThuc
) {

    let dealQueue = [];

    for (let i = 0; i < 6; i++) {

        dealQueue.push('south');
        dealQueue.push('west');
        dealQueue.push('north');
        dealQueue.push('east');

    }

    let queueIndex = 0;

    function chiaTiep() {

        if (queueIndex >= dealQueue.length) {

            renderAllHands();

            if (callbackKetThuc) {
                callbackKetThuc();
            }

            return;
        }

        let currentPlayer =
            dealQueue[queueIndex];

        let cardObj =
            boBaiGoc.pop();

        taoBayChiaBai(currentPlayer);

        setTimeout(() => {

            hands[currentPlayer]
                .push(cardObj);

            renderAllHands();

            queueIndex++;

            chiaTiep();

        }, 220);

    }

    chiaTiep();

}

function taoBayChiaBai(targetPlayer) {

    const center =
        document.getElementById(
            "center-deck"
        );

    const dest =
        document.getElementById(
            `player-${targetPlayer}`
        );

    let dummy =
        document.createElement("div");

    dummy.className =
        "card-base card-back dealing-animation";

    dummy.style.left =
        center.offsetLeft + "px";

    dummy.style.top =
        center.offsetTop + "px";

    document
        .getElementById("game-board")
        .appendChild(dummy);

    requestAnimationFrame(() => {

        dummy.style.left =
            dest.offsetLeft + "px";

        dummy.style.top =
            dest.offsetTop + "px";

        dummy.style.opacity =
            "0.2";

    });

    setTimeout(() => {

        dummy.remove();

    }, 250);

}