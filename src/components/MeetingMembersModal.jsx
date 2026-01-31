import Modal from './Modal';
import MeetingMembersManager from './MeetingMembersManager';

export default function MeetingMembersModal({ isOpen, onClose, meeting }) {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Participants - ${meeting?.meetingTitle || ''}`}
        >
            <MeetingMembersManager meeting={meeting} />
        </Modal>
    );
}
